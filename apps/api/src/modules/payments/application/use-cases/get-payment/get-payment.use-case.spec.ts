import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import { InMemoryPaymentRepository } from '../../../../../../test/support/in-memory/payments/in-memory-payment.repository';

describe('GetPaymentUseCase', () => {
	it('returns the owned payment summary when the payment exists', async () => {
		const repository = new InMemoryPaymentRepository();
		repository.insert(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 2520,
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
			grossAmount: 2520,
			boosterAmount: 1764,
			paymentMethod: 'pix',
		});
	});

	it('throws when the payment belongs to another client', async () => {
		const repository = new InMemoryPaymentRepository();
		repository.insert(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 2520,
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
