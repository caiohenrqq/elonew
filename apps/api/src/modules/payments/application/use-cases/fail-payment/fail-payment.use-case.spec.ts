import type { OrderCredentialCleanupPort } from '@modules/payments/application/ports/order-credential-cleanup.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

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
		this.payments.set(payment.id, payment);
	}

	insert(payment: Payment): void {
		this.payments.set(payment.id, payment);
	}
}

class InMemoryOrderCredentialCleanupPort implements OrderCredentialCleanupPort {
	readonly orderIds: string[] = [];

	async clearCredentials(orderId: string): Promise<void> {
		this.orderIds.push(orderId);
	}
}

describe('FailPaymentUseCase', () => {
	it('fails a payment and clears related order credentials', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const orderCredentialCleanupPort = new InMemoryOrderCredentialCleanupPort();
		paymentRepository.insert(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 100,
			}),
		);

		const useCase = new FailPaymentUseCase(
			paymentRepository,
			orderCredentialCleanupPort,
		);
		await useCase.execute({ paymentId: 'payment-1' });

		const savedPayment = await paymentRepository.findById('payment-1');
		expect(savedPayment?.status).toBe('failed');
		expect(orderCredentialCleanupPort.orderIds).toEqual(['order-1']);
	});

	it('is idempotent when payment is already failed', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const orderCredentialCleanupPort = new InMemoryOrderCredentialCleanupPort();
		const payment = Payment.create({
			id: 'payment-2',
			orderId: 'order-2',
			grossAmount: 100,
		});
		payment.fail();
		paymentRepository.insert(payment);

		const useCase = new FailPaymentUseCase(
			paymentRepository,
			orderCredentialCleanupPort,
		);
		await useCase.execute({ paymentId: 'payment-2' });

		const savedPayment = await paymentRepository.findById('payment-2');
		expect(savedPayment?.status).toBe('failed');
		expect(orderCredentialCleanupPort.orderIds).toEqual(['order-2']);
	});

	it('throws when payment does not exist', async () => {
		const paymentRepository = new InMemoryPaymentRepository();
		const orderCredentialCleanupPort = new InMemoryOrderCredentialCleanupPort();
		const useCase = new FailPaymentUseCase(
			paymentRepository,
			orderCredentialCleanupPort,
		);

		await expect(
			useCase.execute({ paymentId: 'missing-payment' }),
		).rejects.toThrow(PaymentNotFoundError);
		expect(orderCredentialCleanupPort.orderIds).toEqual([]);
	});
});
