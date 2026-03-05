import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { Inject, Injectable } from '@nestjs/common';

type ConfirmPaymentInput = {
	paymentId: string;
};

@Injectable()
export class ConfirmPaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
	) {}

	async execute(input: ConfirmPaymentInput): Promise<void> {
		const payment = await this.paymentRepository.findById(input.paymentId);
		if (!payment) throw new Error('Payment not found.');

		payment.confirm();
		await this.paymentRepository.save(payment);
	}
}
