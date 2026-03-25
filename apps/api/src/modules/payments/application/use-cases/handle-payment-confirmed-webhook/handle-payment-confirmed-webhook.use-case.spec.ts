import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import type { PaymentGatewayPort } from '@modules/payments/application/ports/payment-gateway.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { PaymentWebhookSignatureVerifierPort } from '@modules/payments/application/ports/payment-webhook-signature-verifier.port';
import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentNotFoundError,
	PaymentWebhookNotificationMismatchError,
	PaymentWebhookSignatureInvalidError,
	PaymentWebhookTopicNotSupportedError,
} from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();
	private readonly failOnSavePaymentIds = new Set<string>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
	}

	async findByIdForClient(id: string): Promise<Payment | null> {
		return this.findById(id);
	}

	async findByOrderId(orderId: string): Promise<Payment | null> {
		for (const payment of this.payments.values()) {
			if (payment.orderId === orderId) return payment;
		}

		return null;
	}

	async findByGatewayId(gatewayId: string): Promise<Payment | null> {
		for (const payment of this.payments.values()) {
			if (payment.gatewayId === gatewayId) return payment;
		}

		return null;
	}

	async save(payment: Payment): Promise<void> {
		if (this.failOnSavePaymentIds.has(payment.id))
			throw new Error('Payment save failed.');

		this.payments.set(payment.id, payment);
	}

	insert(payment: Payment): void {
		this.payments.set(payment.id, payment);
	}

	setFailOnSave(paymentId: string): void {
		this.failOnSavePaymentIds.add(paymentId);
	}
}

class InMemoryProcessedWebhookEventPort implements ProcessedWebhookEventPort {
	private readonly processedEventIds = new Set<string>();

	async has(eventId: string): Promise<boolean> {
		return this.processedEventIds.has(eventId);
	}

	async markProcessed(eventId: string): Promise<void> {
		this.processedEventIds.add(eventId);
	}
}

class InMemoryOrderPaymentConfirmationPort
	implements OrderPaymentConfirmationPort
{
	readonly orderIds: string[] = [];

	async markAsPaid(orderId: string): Promise<void> {
		this.orderIds.push(orderId);
	}
}

class AcceptAllPaymentWebhookSignatureVerifier
	implements PaymentWebhookSignatureVerifierPort
{
	async verify(): Promise<boolean> {
		return true;
	}
}

class InMemoryPaymentGatewayPort implements PaymentGatewayPort {
	fetchCalls = 0;

	notification = {
		internalPaymentId: 'payment-1',
		gatewayPaymentId: 'mp-payment-1',
		gatewayStatus: 'approved',
		gatewayStatusDetail: 'accredited',
		isApproved: true,
	};

	async initiatePayment(): Promise<{
		checkoutUrl: string;
		gatewayReferenceId: string;
		gatewayStatus: string | null;
	}> {
		throw new Error('not needed in this test');
	}

	async fetchPaymentNotification(): Promise<{
		internalPaymentId: string;
		gatewayPaymentId: string;
		gatewayStatus: string;
		gatewayStatusDetail: string | null;
		isApproved: boolean;
	}> {
		this.fetchCalls++;
		return this.notification;
	}
}

function processedWebhookKey(notificationResourceId: string): string {
	return `mercadopago:${notificationResourceId}`;
}

describe('HandlePaymentConfirmedWebhookUseCase', () => {
	it('processes a new approved event fetched from the payment gateway and confirms payment', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-1',
				topic: 'payment.updated',
				notificationResourceId: 'notification-1',
				requestId: 'request-1',
				signature: 'signature-1',
			}),
		).resolves.toEqual({ processed: true });

		const savedPayment = await paymentRepository.findById('payment-1');
		expect(savedPayment?.status).toBe('held');
		expect(savedPayment?.gatewayId).toBe('mp-payment-1');
		expect(savedPayment?.gatewayStatus).toBe('approved');
		expect(savedPayment?.gatewayStatusDetail).toBe('accredited');
		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-1']);
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-1')),
		).resolves.toBe(true);
	});

	it('ignores duplicated event ids', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-2',
				orderId: 'order-2',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);
		paymentGatewayPort.notification = {
			internalPaymentId: 'payment-2',
			gatewayPaymentId: 'mp-payment-2',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};

		await useCase.execute({
			eventId: 'event-2',
			topic: 'payment.updated',
			notificationResourceId: 'notification-2',
			requestId: 'request-2',
			signature: 'signature-2',
		});
		await expect(
			useCase.execute({
				eventId: 'event-2',
				topic: 'payment.updated',
				notificationResourceId: 'notification-2',
				requestId: 'request-2',
				signature: 'signature-2',
			}),
		).resolves.toEqual({ processed: false });

		const savedPayment = await paymentRepository.findById('payment-2');
		expect(savedPayment?.status).toBe('held');
		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-2']);
	});

	it('ignores replayed notifications even when the unsigned event id changes', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-2b',
				orderId: 'order-2b',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);
		paymentGatewayPort.notification = {
			internalPaymentId: 'payment-2b',
			gatewayPaymentId: 'mp-payment-2b',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};

		await expect(
			useCase.execute({
				eventId: 'event-2b-original',
				topic: 'payment.updated',
				notificationResourceId: 'notification-2b',
				requestId: 'request-2b',
				signature: 'signature-2b',
			}),
		).resolves.toEqual({ processed: true });
		await expect(
			useCase.execute({
				eventId: 'event-2b-forged',
				topic: 'payment.updated',
				notificationResourceId: 'notification-2b',
				requestId: 'request-2b',
				signature: 'signature-2b',
			}),
		).resolves.toEqual({ processed: false });

		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-2b']);
		expect(paymentGatewayPort.fetchCalls).toBe(1);
	});

	it('ignores replayed notifications when the topic alias changes for the same resource', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-2c',
				orderId: 'order-2c',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);
		paymentGatewayPort.notification = {
			internalPaymentId: 'payment-2c',
			gatewayPaymentId: 'mp-payment-2c',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};

		await expect(
			useCase.execute({
				eventId: 'event-2c-original',
				topic: 'payment',
				notificationResourceId: 'notification-2c',
				requestId: 'request-2c',
				signature: 'signature-2c',
			}),
		).resolves.toEqual({ processed: true });
		await expect(
			useCase.execute({
				eventId: 'event-2c-aliased',
				topic: 'payment.updated',
				notificationResourceId: 'notification-2c',
				requestId: 'request-2c',
				signature: 'signature-2c',
			}),
		).resolves.toEqual({ processed: false });

		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-2c']);
		expect(paymentGatewayPort.fetchCalls).toBe(1);
	});

	it('does not mark event as processed when payment is missing', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentGatewayPort.notification = {
			internalPaymentId: 'missing-payment',
			gatewayPaymentId: 'mp-missing-payment',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-3',
				topic: 'payment.updated',
				notificationResourceId: 'notification-3',
				requestId: 'request-3',
				signature: 'signature-3',
			}),
		).rejects.toThrow(PaymentNotFoundError);
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-3')),
		).resolves.toBe(false);
	});

	it('does not mark event as processed when order confirmation fails', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-5',
				orderId: 'order-5',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);
		const failingOrderPaymentConfirmationPort: OrderPaymentConfirmationPort = {
			async markAsPaid(): Promise<void> {
				throw new Error('Order confirmation failed.');
			},
		};
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentGatewayPort.notification = {
			internalPaymentId: 'payment-5',
			gatewayPaymentId: 'mp-payment-5',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			failingOrderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-5',
				topic: 'payment.updated',
				notificationResourceId: 'notification-5',
				requestId: 'request-5',
				signature: 'signature-5',
			}),
		).rejects.toThrow('Order confirmation failed.');
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-5')),
		).resolves.toBe(false);
	});

	it('does not mark order as paid or event as processed when payment save fails', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-6',
				orderId: 'order-6',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);
		paymentRepository.setFailOnSave('payment-6');
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentGatewayPort.notification = {
			internalPaymentId: 'payment-6',
			gatewayPaymentId: 'mp-payment-6',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-6',
				topic: 'payment.updated',
				notificationResourceId: 'notification-6',
				requestId: 'request-6',
				signature: 'signature-6',
			}),
		).rejects.toThrow('Payment save failed.');
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-6')),
		).resolves.toBe(false);
	});

	it('rejects invalid webhook signatures before processing', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-7',
				orderId: 'order-7',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);
		const rejectingVerifier: PaymentWebhookSignatureVerifierPort = {
			async verify(): Promise<boolean> {
				return false;
			},
		};
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			rejectingVerifier,
			new InMemoryPaymentGatewayPort(),
		);

		await expect(
			useCase.execute({
				eventId: 'event-7',
				topic: 'payment.updated',
				notificationResourceId: 'notification-7',
				requestId: 'request-7',
				signature: 'signature-7',
			}),
		).rejects.toThrow(PaymentWebhookSignatureInvalidError);
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-7')),
		).resolves.toBe(false);
	});

	it('rejects unsupported webhook topics before fetching provider data', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-unsupported-topic',
				topic: 'merchant_order',
				notificationResourceId: 'notification-unsupported-topic',
				requestId: 'request-unsupported-topic',
				signature: 'signature-unsupported-topic',
			}),
		).rejects.toThrow(PaymentWebhookTopicNotSupportedError);

		expect(paymentGatewayPort.fetchCalls).toBe(0);
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		await expect(
			processedWebhookEventPort.has(
				processedWebhookKey('notification-unsupported-topic'),
			),
		).resolves.toBe(false);
	});

	it('does not confirm the payment for non-approved provider statuses while still persisting gateway state', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-8',
				orderId: 'order-8',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);
		paymentGatewayPort.notification = {
			internalPaymentId: 'payment-8',
			gatewayPaymentId: 'mp-payment-8',
			gatewayStatus: 'pending',
			gatewayStatusDetail: 'pending_waiting_payment',
			isApproved: false,
		};
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-8',
				topic: 'payment.updated',
				notificationResourceId: 'notification-8',
				requestId: 'request-8',
				signature: 'signature-8',
			}),
		).resolves.toEqual({ processed: true });
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		const savedPayment = await paymentRepository.findById('payment-8');
		expect(savedPayment?.status).toBe('awaiting_confirmation');
		expect(savedPayment?.gatewayId).toBe('mp-payment-8');
		expect(savedPayment?.gatewayStatus).toBe('pending');
		expect(savedPayment?.gatewayStatusDetail).toBe('pending_waiting_payment');
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-8')),
		).resolves.toBe(true);
	});

	it('rejects webhook notifications missing an internal payment reference from the provider payload', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		paymentGatewayPort.notification = {
			internalPaymentId: '',
			gatewayPaymentId: 'mp-payment-9',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		};
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				eventId: 'event-9',
				topic: 'payment.updated',
				notificationResourceId: 'notification-9',
				requestId: 'request-9',
				signature: 'signature-9',
			}),
		).rejects.toThrow(PaymentWebhookNotificationMismatchError);
		await expect(
			processedWebhookEventPort.has(processedWebhookKey('notification-9')),
		).resolves.toBe(false);
	});
});
