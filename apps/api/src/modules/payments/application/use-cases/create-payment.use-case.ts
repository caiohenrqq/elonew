import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import type { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable } from '@nestjs/common';

type CreatePaymentInput = {
	paymentId: string;
	orderId: string;
	grossAmount: number;
};

type CreatePaymentOutput = {
	id: string;
	orderId: string;
	status: PaymentStatus;
	grossAmount: number;
	boosterAmount: number;
};

@Injectable()
export class CreatePaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
	) {}

	async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
		const existingPayment = await this.paymentRepository.findById(
			input.paymentId,
		);
		if (existingPayment) throw new Error('Payment already exists.');

		const payment = Payment.create({
			id: input.paymentId,
			orderId: input.orderId,
			grossAmount: input.grossAmount,
		});

		await this.paymentRepository.save(payment);

		return {
			id: payment.id,
			orderId: payment.orderId,
			status: payment.status,
			grossAmount: payment.grossAmount,
			boosterAmount: payment.boosterAmount,
		};
	}
}
