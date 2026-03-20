import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<
		string,
		{ payment: Payment; clientId: string }
	>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id)?.payment ?? null;
	}

	async findByIdForClient(
		id: string,
		clientId: string,
	): Promise<Payment | null> {
		const record = this.payments.get(id);
		if (!record || record.clientId !== clientId) return null;

		return record.payment;
	}

	async findByOrderId(orderId: string): Promise<Payment | null> {
		for (const record of this.payments.values()) {
			if (record.payment.orderId === orderId) return record.payment;
		}

		return null;
	}

	async save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, { payment, clientId: 'client-1' });
	}

	insert(payment: Payment, clientId: string): void {
		this.payments.set(payment.id, { payment, clientId });
	}
}

describe('GetPaymentUseCase', () => {
	it('returns the owned payment summary when the payment exists', async () => {
		const repository = new InMemoryPaymentRepository();
		repository.insert(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 25.2,
				paymentMethod: 'pix',
			}),
			'client-1',
		);

		const useCase = new GetPaymentUseCase(repository);

		await expect(
			useCase.execute({ paymentId: 'payment-1', clientId: 'client-1' }),
		).resolves.toEqual({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'awaiting_confirmation',
			grossAmount: 25.2,
			boosterAmount: 17.64,
			paymentMethod: 'pix',
		});
	});

	it('throws when the payment belongs to another client', async () => {
		const repository = new InMemoryPaymentRepository();
		repository.insert(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 25.2,
				paymentMethod: 'pix',
			}),
			'client-2',
		);

		const useCase = new GetPaymentUseCase(repository);

		await expect(
			useCase.execute({ paymentId: 'payment-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentNotFoundError);
	});
});
