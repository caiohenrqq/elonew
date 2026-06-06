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
	PaymentNotFoundError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';
import { Inject, Injectable, Optional } from '@nestjs/common';

type ReleasePaymentHoldInput = {
	paymentId: string;
};

@Injectable()
export class ReleasePaymentHoldUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_STATUS_PORT_KEY)
		private readonly orderStatusPort: OrderStatusPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(input: ReleasePaymentHoldInput): Promise<void> {
		const startedAt = Date.now();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'release_hold',
			payment_id: input.paymentId,
			gateway: 'MERCADO_PAGO',
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

			const orderStatus = await this.orderStatusPort.findByOrderId(
				payment.orderId,
			);
			logEvent.order_status = orderStatus ?? undefined;
			if (!orderStatus) throw new PaymentOrderNotFoundError();

			payment.releaseHold(orderStatus);
			await this.paymentRepository.save(payment);
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
