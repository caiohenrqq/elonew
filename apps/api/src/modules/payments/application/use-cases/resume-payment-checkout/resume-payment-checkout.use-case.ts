import { OrderStatus } from '@modules/orders/domain/order-status';
import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import {
	ORDER_STATUS_PORT_KEY,
	type OrderStatusPort,
} from '@modules/payments/application/ports/order-status.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import {
	PaymentCheckoutResumeNotAllowedError,
	PaymentNotFoundError,
} from '@modules/payments/domain/payment.errors';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable, Optional } from '@nestjs/common';

type ResumePaymentCheckoutInput = {
	orderId: string;
	clientId: string;
};

type ResumePaymentCheckoutOutput = {
	paymentId: string;
	checkoutUrl: string;
};

@Injectable()
export class ResumePaymentCheckoutUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_STATUS_PORT_KEY)
		private readonly orderStatusPort: OrderStatusPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(
		input: ResumePaymentCheckoutInput,
	): Promise<ResumePaymentCheckoutOutput> {
		const startedAt = Date.now();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'resume_checkout',
			client_id: input.clientId,
			order_id: input.orderId,
			gateway: 'MERCADO_PAGO',
		};

		try {
			const payment = await this.paymentRepository.findByOrderIdForClient(
				input.orderId,
				input.clientId,
			);
			if (!payment) throw new PaymentNotFoundError();

			logEvent.payment_id = payment.id;
			logEvent.payment_status_before = payment.status;
			logEvent.payment_status_after = payment.status;
			logEvent.gross_amount = payment.grossAmount;
			logEvent.booster_amount = payment.boosterAmount;
			logEvent.payment_method = payment.paymentMethod;
			logEvent.gateway_payment_id = payment.gatewayId ?? undefined;
			logEvent.gateway_reference_id = payment.gatewayReferenceId ?? undefined;
			logEvent.gateway_status = payment.gatewayStatus ?? undefined;
			logEvent.gateway_status_detail = payment.gatewayStatusDetail ?? undefined;
			logEvent.checkout_url_present = Boolean(payment.checkoutUrl);

			const orderStatus = await this.orderStatusPort.findByOrderIdForClient(
				input.orderId,
				input.clientId,
			);
			logEvent.order_status = orderStatus ?? undefined;
			if (!orderStatus) throw new PaymentNotFoundError();

			if (
				orderStatus !== OrderStatus.AWAITING_PAYMENT ||
				payment.status !== PaymentStatus.AWAITING_CONFIRMATION ||
				!payment.checkoutUrl
			)
				throw new PaymentCheckoutResumeNotAllowedError();

			logEvent.outcome = 'success';

			return {
				paymentId: payment.id,
				checkoutUrl: payment.checkoutUrl,
			};
		} catch (error) {
			markPaymentLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.paymentLifecycleLogger?.emit(logEvent, startedAt);
		}
	}
}
