import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
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

describe('GetPaymentUseCase', () => {
	it('returns payment details when the payment exists', async () => {
		const repository = new InMemoryPaymentRepository();
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
		});
		repository.insert(payment);

		const useCase = new GetPaymentUseCase(repository);

		await expect(useCase.execute({ paymentId: 'payment-1' })).resolves.toEqual({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});
	});

	it('throws when the payment does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const useCase = new GetPaymentUseCase(repository);

		await expect(
			useCase.execute({ paymentId: 'missing-payment' }),
		).rejects.toThrow(PaymentNotFoundError);
	});
});
