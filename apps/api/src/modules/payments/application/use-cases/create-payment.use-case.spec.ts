import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
	}

	async save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, payment);
	}
}

describe('CreatePaymentUseCase', () => {
	it('creates a payment with hold lifecycle & 70% booster amount', async () => {
		const repository = new InMemoryPaymentRepository();
		const useCase = new CreatePaymentUseCase(repository);

		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				orderId: 'order-1',
				grossAmount: 100,
			}),
		).resolves.toEqual({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});
	});

	it('throws when payment id already exists', async () => {
		const repository = new InMemoryPaymentRepository();
		await repository.save(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 100,
			}),
		);

		const useCase = new CreatePaymentUseCase(repository);
		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				orderId: 'order-2',
				grossAmount: 40,
			}),
		).rejects.toThrow('Payment already exists.');
	});
});
