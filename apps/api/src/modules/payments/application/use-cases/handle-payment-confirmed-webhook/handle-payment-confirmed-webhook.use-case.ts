import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import {
	ORDER_CREDENTIAL_CLEANUP_PORT_KEY,
	type OrderCredentialCleanupPort,
} from '@modules/payments/application/ports/order-credential-cleanup.port';
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
import { Inject, Injectable, Optional } from '@nestjs/common';

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

type PaymentWebhookResolution = 'confirm' | 'fail' | 'pending' | 'defer';

@Injectable()
export class HandlePaymentConfirmedWebhookUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(PROCESSED_WEBHOOK_EVENT_PORT_KEY)
		private readonly processedWebhookEventPort: ProcessedWebhookEventPort,
		@Inject(ORDER_PAYMENT_CONFIRMATION_PORT_KEY)
		private readonly orderPaymentConfirmationPort: OrderPaymentConfirmationPort,
		@Inject(ORDER_CREDENTIAL_CLEANUP_PORT_KEY)
		private readonly orderCredentialCleanupPort: OrderCredentialCleanupPort,
		@Inject(PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY)
		private readonly paymentWebhookSignatureVerifier: PaymentWebhookSignatureVerifierPort,
		@Inject(PAYMENT_GATEWAY_PORT_KEY)
		private readonly paymentGatewayPort: PaymentGatewayPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(
		input: HandlePaymentConfirmedWebhookInput,
	): Promise<HandlePaymentConfirmedWebhookOutput> {
		const startedAt = Date.now();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'mercadopago_webhook',
			gateway: 'MERCADO_PAGO',
			webhook_event_id: input.eventId,
			webhook_topic: input.topic,
			webhook_resource_id: input.notificationResourceId,
			webhook_request_id: input.requestId,
			side_effects: [],
		};

		try {
			const isSignatureValid =
				await this.paymentWebhookSignatureVerifier.verify(input);
			logEvent.webhook_signature_valid = isSignatureValid;
			if (!isSignatureValid) throw new PaymentWebhookSignatureInvalidError();
			if (!this.isSupportedTopic(input.topic))
				throw new PaymentWebhookTopicNotSupportedError();

			const processedEventKey = this.buildProcessedEventKey(
				input.notificationResourceId,
			);
			logEvent.webhook_processed_event_key = processedEventKey;
			const alreadyProcessed =
				await this.processedWebhookEventPort.has(processedEventKey);
			logEvent.webhook_already_processed = alreadyProcessed;
			if (alreadyProcessed) {
				logEvent.outcome = 'skipped';
				return { processed: false };
			}

			const notification =
				await this.paymentGatewayPort.fetchPaymentNotification({
					notificationId: input.notificationResourceId,
				});
			if (!notification.internalPaymentId)
				throw new PaymentWebhookNotificationMismatchError();

			logEvent.payment_id = notification.internalPaymentId;
			logEvent.gateway_payment_id = notification.gatewayPaymentId;
			logEvent.gateway_status = notification.gatewayStatus;
			logEvent.gateway_status_detail =
				notification.gatewayStatusDetail ?? undefined;

			const payment = await this.paymentRepository.findById(
				notification.internalPaymentId,
			);
			if (!payment) throw new PaymentNotFoundError();

			logEvent.order_id = payment.orderId;
			logEvent.payment_status_before = payment.status;
			logEvent.gross_amount = payment.grossAmount;
			logEvent.booster_amount = payment.boosterAmount;
			logEvent.payment_method = payment.paymentMethod;

			payment.attachGatewayDetails({
				gatewayId: notification.gatewayPaymentId,
				gatewayStatus: notification.gatewayStatus,
				gatewayStatusDetail: notification.gatewayStatusDetail,
			});

			const resolution = this.resolveNotification(notification.gatewayStatus);
			logEvent.webhook_resolution = resolution;
			if (resolution === 'confirm') payment.confirm();
			if (resolution === 'fail') payment.fail();
			await this.paymentRepository.save(payment);
			if (resolution === 'confirm') {
				await this.orderPaymentConfirmationPort.markAsPaid(payment.orderId);
				logEvent.side_effects?.push('order_marked_paid');
			}
			if (resolution === 'fail') {
				await this.orderCredentialCleanupPort.clearCredentials(payment.orderId);
				logEvent.side_effects?.push('order_credentials_cleared');
			}
			await this.processedWebhookEventPort.markProcessed(processedEventKey);

			logEvent.outcome = 'success';
			logEvent.payment_status_after = payment.status;

			return { processed: true };
		} catch (error) {
			markPaymentLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.paymentLifecycleLogger?.emit(logEvent, startedAt);
		}
	}

	private isSupportedTopic(topic: string): boolean {
		return topic === 'payment' || topic === 'payment.updated';
	}

	private buildProcessedEventKey(notificationResourceId: string): string {
		return `mercadopago:${notificationResourceId}`;
	}

	private resolveNotification(gatewayStatus: string): PaymentWebhookResolution {
		switch (gatewayStatus) {
			case 'approved':
				return 'confirm';
			case 'authorized':
			case 'pending':
			case 'in_process':
				return 'pending';
			case 'rejected':
			case 'cancelled':
				return 'fail';
			default:
				return 'defer';
		}
	}
}
