import {
	ORDER_CREDENTIAL_CLEANUP_PORT_KEY,
	type OrderCredentialCleanupPort,
} from '@modules/payments/application/ports/order-credential-cleanup.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import { Inject, Injectable } from '@nestjs/common';

type FailPaymentInput = {
	paymentId: string;
};

@Injectable()
export class FailPaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_CREDENTIAL_CLEANUP_PORT_KEY)
		private readonly orderCredentialCleanupPort: OrderCredentialCleanupPort,
	) {}

	async execute(input: FailPaymentInput): Promise<void> {
		const payment = await this.paymentRepository.findById(input.paymentId);
		if (!payment) throw new PaymentNotFoundError();

		payment.fail();
		await this.paymentRepository.save(payment);
		await this.orderCredentialCleanupPort.clearCredentials(payment.orderId);
	}
}
