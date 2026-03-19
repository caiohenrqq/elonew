import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import type { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable } from '@nestjs/common';

type GetPaymentInput = {
	paymentId: string;
	clientId: string;
};

type GetPaymentOutput = {
	id: string;
	orderId: string;
	status: PaymentStatus;
	grossAmount: number;
	boosterAmount: number;
};

@Injectable()
export class GetPaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
	) {}

	async execute(input: GetPaymentInput): Promise<GetPaymentOutput> {
		const payment = await this.paymentRepository.findByIdForClient(
			input.paymentId,
			input.clientId,
		);
		if (!payment) throw new PaymentNotFoundError();

		return {
			id: payment.id,
			orderId: payment.orderId,
			status: payment.status,
			grossAmount: payment.grossAmount,
			boosterAmount: payment.boosterAmount,
		};
	}
}
