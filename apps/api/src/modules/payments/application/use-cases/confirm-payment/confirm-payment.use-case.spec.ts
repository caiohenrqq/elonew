import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();
	private readonly failOnSavePaymentIds = new Set<string>();

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

	async findByGatewayId(): Promise<Payment | null> {
		throw new Error('not needed in this test');
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
