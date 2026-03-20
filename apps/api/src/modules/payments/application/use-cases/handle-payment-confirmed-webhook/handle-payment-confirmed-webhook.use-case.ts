import {
	ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
	type OrderPaymentConfirmationPort,
} from '@modules/payments/application/ports/order-payment-confirmation.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import {
	PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY,
	type PaymentWebhookSignatureVerifierPort,
} from '@modules/payments/application/ports/payment-webhook-signature-verifier.port';
import {
	PROCESSED_WEBHOOK_EVENT_PORT_KEY,
	type ProcessedWebhookEventPort,
} from '@modules/payments/application/ports/processed-webhook-event.port';
import {
	PaymentNotFoundError,
	PaymentWebhookNotificationMismatchError,
	PaymentWebhookSignatureInvalidError,
} from '@modules/payments/domain/payment.errors';
import { Inject, Injectable } from '@nestjs/common';

type HandlePaymentConfirmedWebhookInput = {
	eventId: string;
	paymentId: string;
	notificationResourceId: string;
	requestId?: string;
	signature?: string;
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
		@Inject(ORDER_PAYMENT_CONFIRMATION_PORT_KEY)
		private readonly orderPaymentConfirmationPort: OrderPaymentConfirmationPort,
		@Inject(PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY)
		private readonly paymentWebhookSignatureVerifier: PaymentWebhookSignatureVerifierPort,
	) {}

	async execute(
		input: HandlePaymentConfirmedWebhookInput,
	): Promise<HandlePaymentConfirmedWebhookOutput> {
		const isSignatureValid =
			await this.paymentWebhookSignatureVerifier.verify(input);
		if (!isSignatureValid) throw new PaymentWebhookSignatureInvalidError();
		if (input.notificationResourceId !== input.paymentId)
			throw new PaymentWebhookNotificationMismatchError();

		const alreadyProcessed = await this.processedWebhookEventPort.has(
			input.eventId,
		);
		if (alreadyProcessed) return { processed: false };

		const payment = await this.paymentRepository.findById(input.paymentId);
		if (!payment) throw new PaymentNotFoundError();

		payment.confirm();
		await this.paymentRepository.save(payment);
		await this.orderPaymentConfirmationPort.markAsPaid(payment.orderId);
		await this.processedWebhookEventPort.markProcessed(input.eventId);

		return { processed: true };
	}
}
