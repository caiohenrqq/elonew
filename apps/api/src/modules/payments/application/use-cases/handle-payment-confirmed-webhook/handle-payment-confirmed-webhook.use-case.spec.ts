import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { PaymentWebhookSignatureVerifierPort } from '@modules/payments/application/ports/payment-webhook-signature-verifier.port';
import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentNotFoundError,
	PaymentWebhookNotificationMismatchError,
	PaymentWebhookSignatureInvalidError,
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

describe('HandlePaymentConfirmedWebhookUseCase', () => {
	it('processes a new event and confirms payment', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
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
		);

		await expect(
			useCase.execute({
				eventId: 'event-1',
				paymentId: 'payment-1',
				notificationResourceId: 'payment-1',
				requestId: 'request-1',
				signature: 'signature-1',
			}),
		).resolves.toEqual({ processed: true });

		const savedPayment = await paymentRepository.findById('payment-1');
		expect(savedPayment?.status).toBe('held');
		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-1']);
		await expect(processedWebhookEventPort.has('event-1')).resolves.toBe(true);
	});

	it('ignores duplicated event ids', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
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
		);

		await useCase.execute({
			eventId: 'event-2',
			paymentId: 'payment-2',
			notificationResourceId: 'payment-2',
			requestId: 'request-2',
			signature: 'signature-2',
		});
		await expect(
			useCase.execute({
				eventId: 'event-2',
				paymentId: 'payment-2',
				notificationResourceId: 'payment-2',
				requestId: 'request-2',
				signature: 'signature-2',
			}),
		).resolves.toEqual({ processed: false });

		const savedPayment = await paymentRepository.findById('payment-2');
		expect(savedPayment?.status).toBe('held');
		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-2']);
	});

	it('does not mark event as processed when payment is missing', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
		);

		await expect(
			useCase.execute({
				eventId: 'event-3',
				paymentId: 'missing-payment',
				notificationResourceId: 'missing-payment',
				requestId: 'request-3',
				signature: 'signature-3',
			}),
		).rejects.toThrow(PaymentNotFoundError);
		await expect(processedWebhookEventPort.has('event-3')).resolves.toBe(false);
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
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			failingOrderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
		);

		await expect(
			useCase.execute({
				eventId: 'event-5',
				paymentId: 'payment-5',
				notificationResourceId: 'payment-5',
				requestId: 'request-5',
				signature: 'signature-5',
			}),
		).rejects.toThrow('Order confirmation failed.');
		await expect(processedWebhookEventPort.has('event-5')).resolves.toBe(false);
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
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
		);

		await expect(
			useCase.execute({
				eventId: 'event-6',
				paymentId: 'payment-6',
				notificationResourceId: 'payment-6',
				requestId: 'request-6',
				signature: 'signature-6',
			}),
		).rejects.toThrow('Payment save failed.');
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		await expect(processedWebhookEventPort.has('event-6')).resolves.toBe(false);
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
		);

		await expect(
			useCase.execute({
				eventId: 'event-7',
				paymentId: 'payment-7',
				notificationResourceId: 'payment-7',
				requestId: 'request-7',
				signature: 'signature-7',
			}),
		).rejects.toThrow(PaymentWebhookSignatureInvalidError);
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		await expect(processedWebhookEventPort.has('event-7')).resolves.toBe(false);
	});

	it('rejects webhook payloads that do not match the signed resource id', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
			new AcceptAllPaymentWebhookSignatureVerifier(),
		);

		await expect(
			useCase.execute({
				eventId: 'event-8',
				paymentId: 'payment-8',
				notificationResourceId: 'payment-other',
				requestId: 'request-8',
				signature: 'signature-8',
			}),
		).rejects.toThrow(PaymentWebhookNotificationMismatchError);
		await expect(processedWebhookEventPort.has('event-8')).resolves.toBe(false);
	});
});
