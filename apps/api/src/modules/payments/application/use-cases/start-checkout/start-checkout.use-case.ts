import { randomUUID } from 'node:crypto';
import {
	ORDER_CHECKOUT_PORT_KEY,
	type OrderCheckoutPort,
} from '@modules/orders/application/ports/order-checkout.port';
import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import {
	PAYMENT_GATEWAY_PORT_KEY,
	type PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentOrderNotFoundError } from '@modules/payments/domain/payment.errors';
import type { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Money } from '@packages/shared/money/money';
import type { PaymentMethod } from '@packages/shared/payments/payment-method';

type StartCheckoutInput = {
	clientId: string;
	quoteId: string;
	paymentMethod: PaymentMethod;
	now: Date;
};

type StartCheckoutOutput = {
	orderId: string;
	paymentId: string;
	status: PaymentStatus;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: PaymentMethod;
	checkoutUrl: string;
};

@Injectable()
export class StartCheckoutUseCase {
	constructor(
		@Inject(ORDER_CHECKOUT_PORT_KEY)
		private readonly orderCheckout: OrderCheckoutPort,
		@Inject(PAYMENT_GATEWAY_PORT_KEY)
		private readonly paymentGatewayPort: PaymentGatewayPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(input: StartCheckoutInput): Promise<StartCheckoutOutput> {
		const startedAt = Date.now();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'create',
			client_id: input.clientId,
			payment_method: input.paymentMethod,
			gateway: 'MERCADO_PAGO',
		};

		try {
			const grossAmount = await this.orderCheckout.findOwnedQuoteTotalAmount({
				quoteId: input.quoteId,
				clientId: input.clientId,
			});
			if (grossAmount === null) throw new PaymentOrderNotFoundError();

			const orderId = randomUUID();
			const payment = Payment.create({
				id: randomUUID(),
				orderId,
				grossAmount,
				paymentMethod: input.paymentMethod,
			});
			logEvent.order_id = orderId;
			logEvent.payment_id = payment.id;
			logEvent.payment_status_before = payment.status;
			logEvent.gross_amount = payment.grossAmount;
			logEvent.booster_amount = payment.boosterAmount;

			const grossAmountInReais = Money.fromCents(grossAmount).toDecimal();
			const gatewayPayment = await this.paymentGatewayPort.initiatePayment({
				paymentId: payment.id,
				orderId,
				amount: grossAmountInReais,
				paymentMethod: input.paymentMethod,
			});
			payment.attachGatewayDetails({
				gatewayReferenceId: gatewayPayment.gatewayReferenceId,
				gatewayId: null,
				gatewayStatus: gatewayPayment.gatewayStatus,
				gatewayStatusDetail: null,
				checkoutUrl: gatewayPayment.checkoutUrl,
			});

			const order = await this.orderCheckout.createDraftOrderFromOwnedQuote({
				orderId,
				clientId: input.clientId,
				quoteId: input.quoteId,
				now: input.now,
				payment: {
					id: payment.id,
					status: payment.status,
					grossAmount: payment.grossAmount,
					boosterAmount: payment.boosterAmount,
					paymentMethod: payment.paymentMethod,
					gateway: payment.gateway,
					gatewayReferenceId: payment.gatewayReferenceId,
					gatewayId: payment.gatewayId,
					gatewayStatus: payment.gatewayStatus,
					gatewayStatusDetail: payment.gatewayStatusDetail,
					checkoutUrl: payment.checkoutUrl,
				},
			});

			logEvent.outcome = 'success';
			logEvent.order_status = order.status;
			logEvent.payment_status_after = payment.status;
			logEvent.gateway_reference_id = payment.gatewayReferenceId ?? undefined;
			logEvent.gateway_status = payment.gatewayStatus ?? undefined;
			logEvent.checkout_url_present = Boolean(payment.checkoutUrl);
			logEvent.back_url = gatewayPayment.backUrl ?? undefined;

			return {
				orderId: order.id,
				paymentId: payment.id,
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
