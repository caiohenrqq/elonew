import {
	ORDER_STATUS_PORT_KEY,
	type OrderStatusPort,
} from '@modules/payments/application/ports/order-status.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { Inject, Injectable } from '@nestjs/common';

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
	) {}

	async execute(input: ReleasePaymentHoldInput): Promise<void> {
		const payment = await this.paymentRepository.findById(input.paymentId);
		if (!payment) throw new Error('Payment not found.');

		const orderStatus = await this.orderStatusPort.findByOrderId(
			payment.orderId,
		);
		if (!orderStatus) throw new Error('Order not found.');

		payment.releaseHold(orderStatus);
		await this.paymentRepository.save(payment);
	}
}
