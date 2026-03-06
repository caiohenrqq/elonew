import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
	}

	async save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, payment);
	}

	insert(payment: Payment): void {
		this.payments.set(payment.id, payment);
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

describe('HandlePaymentConfirmedWebhookUseCase', () => {
	it('processes a new event and confirms payment', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
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
		);

		await expect(
			useCase.execute({ eventId: 'event-1', paymentId: 'payment-1' }),
		).resolves.toEqual({ processed: true });

		const savedPayment = await paymentRepository.findById('payment-1');
		expect(savedPayment?.status).toBe('held');
		await expect(processedWebhookEventPort.has('event-1')).resolves.toBe(true);
	});

	it('ignores duplicated event ids', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();
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
		);

		await useCase.execute({ eventId: 'event-2', paymentId: 'payment-2' });
		await expect(
			useCase.execute({ eventId: 'event-2', paymentId: 'payment-2' }),
		).resolves.toEqual({ processed: false });

		const savedPayment = await paymentRepository.findById('payment-2');
		expect(savedPayment?.status).toBe('held');
	});

	it('does not mark event as processed when payment is missing', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const processedWebhookEventPort = new InMemoryProcessedWebhookEventPort();

		const useCase = new HandlePaymentConfirmedWebhookUseCase(
			paymentRepository,
			processedWebhookEventPort,
		);

		await expect(
			useCase.execute({ eventId: 'event-3', paymentId: 'missing-payment' }),
		).rejects.toThrow(PaymentNotFoundError);
		await expect(processedWebhookEventPort.has('event-3')).resolves.toBe(false);
	});
});
