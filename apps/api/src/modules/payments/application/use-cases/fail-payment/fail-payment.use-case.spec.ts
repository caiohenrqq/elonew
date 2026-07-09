import type { OrderCredentialCleanupPort } from '@modules/payments/application/ports/order-credential-cleanup.port';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import { InMemoryPaymentRepository } from '../../../../../../test/support/in-memory/payments/in-memory-payment.repository';

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
				paymentMethod: 'pix',
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
			paymentMethod: 'pix',
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
