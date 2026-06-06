import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import {
	ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
	type OrderPaymentConfirmationPort,
} from '@modules/payments/application/ports/order-payment-confirmation.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import { Inject, Injectable, Optional } from '@nestjs/common';

type ConfirmPaymentInput = {
	paymentId: string;
};

@Injectable()
export class ConfirmPaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_PAYMENT_CONFIRMATION_PORT_KEY)
		private readonly orderPaymentConfirmationPort: OrderPaymentConfirmationPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(input: ConfirmPaymentInput): Promise<void> {
		const startedAt = Date.now();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'confirm',
			payment_id: input.paymentId,
			gateway: 'MERCADO_PAGO',
			side_effects: [],
		};

		try {
			const payment = await this.paymentRepository.findById(input.paymentId);
			if (!payment) throw new PaymentNotFoundError();

			logEvent.order_id = payment.orderId;
			logEvent.payment_status_before = payment.status;
			logEvent.gross_amount = payment.grossAmount;
			logEvent.booster_amount = payment.boosterAmount;
			logEvent.payment_method = payment.paymentMethod;
			logEvent.gateway_payment_id = payment.gatewayId ?? undefined;
			logEvent.gateway_reference_id = payment.gatewayReferenceId ?? undefined;
			logEvent.gateway_status = payment.gatewayStatus ?? undefined;
			logEvent.gateway_status_detail = payment.gatewayStatusDetail ?? undefined;

			payment.confirm();
			await this.paymentRepository.save(payment);
			await this.orderPaymentConfirmationPort.markAsPaid(payment.orderId);
			logEvent.side_effects?.push('order_marked_paid');
			logEvent.outcome = 'success';
			logEvent.payment_status_after = payment.status;
		} catch (error) {
			markPaymentLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.paymentLifecycleLogger?.emit(logEvent, startedAt);
		}
	}
}
