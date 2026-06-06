import { randomUUID } from 'node:crypto';
import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import {
	ORDER_PAYMENT_AMOUNT_PORT_KEY,
	type OrderPaymentAmountPort,
} from '@modules/payments/application/ports/order-payment-amount.port';
import {
	ORDER_STATUS_PORT_KEY,
	type OrderStatusPort,
} from '@modules/payments/application/ports/order-status.port';
import {
	PAYMENT_GATEWAY_PORT_KEY,
	type PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentAlreadyExistsError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';
import type { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PaymentMethod } from '@packages/shared/payments/payment-method';

type CreatePaymentInput = {
	clientId: string;
	orderId: string;
	paymentMethod: PaymentMethod;
};

type CreatePaymentOutput = {
	id: string;
	orderId: string;
	status: PaymentStatus;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: PaymentMethod;
	checkoutUrl: string;
};

@Injectable()
export class CreatePaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_STATUS_PORT_KEY)
		private readonly orderStatusPort: OrderStatusPort,
		@Inject(ORDER_PAYMENT_AMOUNT_PORT_KEY)
		private readonly orderPaymentAmountPort: OrderPaymentAmountPort,
		@Inject(PAYMENT_GATEWAY_PORT_KEY)
		private readonly paymentGatewayPort: PaymentGatewayPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
		const startedAt = Date.now();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'create',
			client_id: input.clientId,
			order_id: input.orderId,
			payment_method: input.paymentMethod,
			gateway: 'MERCADO_PAGO',
		};

		try {
			const existingPayment = await this.paymentRepository.findByOrderId(
				input.orderId,
			);
			if (existingPayment) throw new PaymentAlreadyExistsError();

			const orderStatus = await this.orderStatusPort.findByOrderIdForClient(
				input.orderId,
				input.clientId,
			);
			logEvent.order_status = orderStatus ?? undefined;
			if (!orderStatus) throw new PaymentOrderNotFoundError();
			const grossAmount =
				await this.orderPaymentAmountPort.findByOrderIdForClient(
					input.orderId,
					input.clientId,
				);
			if (grossAmount === null) throw new PaymentOrderNotFoundError();

			const payment = Payment.create({
				id: randomUUID(),
				orderId: input.orderId,
				grossAmount,
				paymentMethod: input.paymentMethod,
			});
			logEvent.payment_id = payment.id;
			logEvent.payment_status_before = payment.status;
			logEvent.gross_amount = payment.grossAmount;
			logEvent.booster_amount = payment.boosterAmount;
			const gatewayPayment = await this.paymentGatewayPort.initiatePayment({
				paymentId: payment.id,
				orderId: input.orderId,
				amount: grossAmount,
				paymentMethod: input.paymentMethod,
			});
			payment.attachGatewayDetails({
				gatewayReferenceId: gatewayPayment.gatewayReferenceId,
				gatewayId: null,
				gatewayStatus: gatewayPayment.gatewayStatus,
				gatewayStatusDetail: null,
				checkoutUrl: gatewayPayment.checkoutUrl,
			});

			await this.paymentRepository.save(payment);

			logEvent.outcome = 'success';
			logEvent.payment_status_after = payment.status;
			logEvent.gateway_reference_id = payment.gatewayReferenceId ?? undefined;
			logEvent.gateway_status = payment.gatewayStatus ?? undefined;
			logEvent.checkout_url_present = Boolean(payment.checkoutUrl);

			return {
				id: payment.id,
				orderId: payment.orderId,
				status: payment.status,
				grossAmount: payment.grossAmount,
				boosterAmount: payment.boosterAmount,
				paymentMethod: payment.paymentMethod,
				checkoutUrl: gatewayPayment.checkoutUrl,
			};
		} catch (error) {
			markPaymentLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.paymentLifecycleLogger?.emit(logEvent, startedAt);
		}
	}
}
