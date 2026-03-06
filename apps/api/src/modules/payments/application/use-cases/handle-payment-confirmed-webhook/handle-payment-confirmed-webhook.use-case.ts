import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import {
	PROCESSED_WEBHOOK_EVENT_PORT_KEY,
	type ProcessedWebhookEventPort,
} from '@modules/payments/application/ports/processed-webhook-event.port';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import { Inject, Injectable } from '@nestjs/common';

type HandlePaymentConfirmedWebhookInput = {
	eventId: string;
	paymentId: string;
};

type HandlePaymentConfirmedWebhookOutput = {
	processed: boolean;
};

@Injectable()
export class HandlePaymentConfirmedWebhookUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(PROCESSED_WEBHOOK_EVENT_PORT_KEY)
		private readonly processedWebhookEventPort: ProcessedWebhookEventPort,
	) {}

	async execute(
		input: HandlePaymentConfirmedWebhookInput,
	): Promise<HandlePaymentConfirmedWebhookOutput> {
		const alreadyProcessed = await this.processedWebhookEventPort.has(
			input.eventId,
		);
		if (alreadyProcessed) return { processed: false };

		const payment = await this.paymentRepository.findById(input.paymentId);
		if (!payment) throw new PaymentNotFoundError();

		payment.confirm();
		await this.paymentRepository.save(payment);
		await this.processedWebhookEventPort.markProcessed(input.eventId);

		return { processed: true };
	}
}
