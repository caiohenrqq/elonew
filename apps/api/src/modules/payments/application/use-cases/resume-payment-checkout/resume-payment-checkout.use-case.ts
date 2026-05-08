import { OrderStatus } from '@modules/orders/domain/order-status';
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
import { Inject, Injectable } from '@nestjs/common';

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
	) {}

	async execute(
		input: ResumePaymentCheckoutInput,
	): Promise<ResumePaymentCheckoutOutput> {
		const payment = await this.paymentRepository.findByOrderIdForClient(
			input.orderId,
			input.clientId,
		);
		if (!payment) throw new PaymentNotFoundError();

		const orderStatus = await this.orderStatusPort.findByOrderIdForClient(
			input.orderId,
			input.clientId,
		);
		if (!orderStatus) throw new PaymentNotFoundError();

		if (
			orderStatus !== OrderStatus.AWAITING_PAYMENT ||
			payment.status !== PaymentStatus.AWAITING_CONFIRMATION ||
			!payment.checkoutUrl
		)
			throw new PaymentCheckoutResumeNotAllowedError();

		return {
			paymentId: payment.id,
			checkoutUrl: payment.checkoutUrl,
		};
	}
}
