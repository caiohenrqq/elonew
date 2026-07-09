import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import { InMemoryPaymentRepository } from '../../../../../../test/support/in-memory/payments/in-memory-payment.repository';

class InMemoryOrderPaymentConfirmationPort
	implements OrderPaymentConfirmationPort
{
	readonly orderIds: string[] = [];

	async markAsPaid(orderId: string): Promise<void> {
		this.orderIds.push(orderId);
	}
}

describe('ConfirmPaymentUseCase', () => {
	it('moves payment to held status', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		repository.insert(payment);

		const useCase = new ConfirmPaymentUseCase(
			repository,
			orderPaymentConfirmationPort,
		);
		await useCase.execute({ paymentId: 'payment-1' });

		const savedPayment = await repository.findById('payment-1');
		expect(savedPayment?.status).toBe('held');
		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-1']);
	});

	it('throws when payment does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const useCase = new ConfirmPaymentUseCase(
			repository,
			orderPaymentConfirmationPort,
		);

		await expect(
			useCase.execute({ paymentId: 'missing-payment' }),
		).rejects.toThrow(PaymentNotFoundError);
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
	});

	it('is idempotent when payment is already held', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const payment = Payment.create({
			id: 'payment-2',
			orderId: 'order-2',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		payment.confirm();
		repository.insert(payment);

		const useCase = new ConfirmPaymentUseCase(
			repository,
			orderPaymentConfirmationPort,
		);
		await expect(
			useCase.execute({ paymentId: 'payment-2' }),
		).resolves.toBeUndefined();

		const savedPayment = await repository.findById('payment-2');
		expect(savedPayment?.status).toBe('held');
		expect(orderPaymentConfirmationPort.orderIds).toEqual(['order-2']);
	});

	it('does not mark order as paid when payment save fails', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderPaymentConfirmationPort =
			new InMemoryOrderPaymentConfirmationPort();
		const payment = Payment.create({
			id: 'payment-3',
			orderId: 'order-3',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		repository.insert(payment);
		repository.setFailOnSave('payment-3');
		const useCase = new ConfirmPaymentUseCase(
			repository,
			orderPaymentConfirmationPort,
		);

		await expect(useCase.execute({ paymentId: 'payment-3' })).rejects.toThrow(
			'Payment save failed.',
		);
		expect(orderPaymentConfirmationPort.orderIds).toEqual([]);
	});
});
