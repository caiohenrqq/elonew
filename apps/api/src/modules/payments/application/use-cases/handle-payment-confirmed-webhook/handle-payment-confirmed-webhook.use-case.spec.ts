import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();
	private readonly failOnSavePaymentIds = new Set<string>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
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
			}),
		);

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
		);

		await expect(
			useCase.execute({ eventId: 'event-1', paymentId: 'payment-1' }),
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
			}),
		);

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
		);

		await useCase.execute({ eventId: 'event-2', paymentId: 'payment-2' });
		await expect(
			useCase.execute({ eventId: 'event-2', paymentId: 'payment-2' }),
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
		);

		await expect(
			useCase.execute({ eventId: 'event-3', paymentId: 'missing-payment' }),
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
		);

		await expect(
			useCase.execute({ eventId: 'event-5', paymentId: 'payment-5' }),
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
			}),
		);
		paymentRepository.setFailOnSave('payment-6');
		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
			orderPaymentConfirmationPort,
		);

		await expect(
			useCase.execute({ eventId: 'event-6', paymentId: 'payment-6' }),
		).rejects.toThrow('Payment save failed.');
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
		await expect(processedWebhookEventPort.has('event-6')).resolves.toBe(false);
	});
});
