import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
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

describe('ConfirmPaymentUseCase', () => {
	it('moves payment to held status', async () => {
		const repository = new InMemoryPaymentRepository();
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
		});
		repository.insert(payment);

		const useCase = new ConfirmPaymentUseCase(repository);
		await useCase.execute({ paymentId: 'payment-1' });

		const savedPayment = await repository.findById('payment-1');
		expect(savedPayment?.status).toBe('held');
	});

	it('throws when payment does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const useCase = new ConfirmPaymentUseCase(repository);

		await expect(
			useCase.execute({ paymentId: 'missing-payment' }),
		).rejects.toThrow(PaymentNotFoundError);
	});

	it('is idempotent when payment is already held', async () => {
		const repository = new InMemoryPaymentRepository();
		const payment = Payment.create({
			id: 'payment-2',
			orderId: 'order-2',
			grossAmount: 100,
		});
		payment.confirm();
		repository.insert(payment);

		const useCase = new ConfirmPaymentUseCase(repository);
		await expect(
			useCase.execute({ paymentId: 'payment-2' }),
		).resolves.toBeUndefined();

		const savedPayment = await repository.findById('payment-2');
		expect(savedPayment?.status).toBe('held');
	});
});
