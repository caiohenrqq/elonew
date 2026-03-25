import {
	ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
	type OrderPaymentConfirmationPort,
} from '@modules/payments/application/ports/order-payment-confirmation.port';
import {
	PAYMENT_GATEWAY_PORT_KEY,
	type PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
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
	PaymentWebhookTopicNotSupportedError,
} from '@modules/payments/domain/payment.errors';
import { Inject, Injectable } from '@nestjs/common';

type HandlePaymentConfirmedWebhookInput = {
	eventId: string;
	topic: string;
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
		@Inject(PAYMENT_GATEWAY_PORT_KEY)
		private readonly paymentGatewayPort: PaymentGatewayPort,
	) {}

	async execute(
		input: HandlePaymentConfirmedWebhookInput,
	): Promise<HandlePaymentConfirmedWebhookOutput> {
		const isSignatureValid =
			await this.paymentWebhookSignatureVerifier.verify(input);
		if (!isSignatureValid) throw new PaymentWebhookSignatureInvalidError();
		if (!this.isSupportedTopic(input.topic))
			throw new PaymentWebhookTopicNotSupportedError();

		const processedEventKey = this.buildProcessedEventKey(
			input.notificationResourceId,
		);
		const alreadyProcessed =
			await this.processedWebhookEventPort.has(processedEventKey);
		if (alreadyProcessed) return { processed: false };

		const notification = await this.paymentGatewayPort.fetchPaymentNotification(
			{
				notificationId: input.notificationResourceId,
			},
		);
		if (!notification.internalPaymentId)
			throw new PaymentWebhookNotificationMismatchError();

		const payment = await this.paymentRepository.findById(
			notification.internalPaymentId,
		);
		if (!payment) throw new PaymentNotFoundError();

		payment.attachGatewayDetails({
			gatewayId: notification.gatewayPaymentId,
			gatewayStatus: notification.gatewayStatus,
			gatewayStatusDetail: notification.gatewayStatusDetail,
		});
		if (notification.isApproved) payment.confirm();
		await this.paymentRepository.save(payment);
		if (notification.isApproved)
			await this.orderPaymentConfirmationPort.markAsPaid(payment.orderId);
		await this.processedWebhookEventPort.markProcessed(processedEventKey);

		return { processed: true };
	}

	private isSupportedTopic(topic: string): boolean {
		return topic === 'payment' || topic === 'payment.updated';
	}

	private buildProcessedEventKey(notificationResourceId: string): string {
		return `mercadopago:${notificationResourceId}`;
	}
}
