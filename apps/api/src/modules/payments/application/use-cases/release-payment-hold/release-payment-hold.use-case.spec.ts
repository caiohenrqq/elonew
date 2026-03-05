import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';

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

class InMemoryOrderStatusPort implements OrderStatusPort {
	private readonly orderStatuses = new Map<string, OrderStatus>();

	set(orderId: string, status: OrderStatus): void {
		this.orderStatuses.set(orderId, status);
	}

	async findByOrderId(orderId: string): Promise<OrderStatus | null> {
		return this.orderStatuses.get(orderId) ?? null;
	}
}

describe('ReleasePaymentHoldUseCase', () => {
	it('releases hold when order is completed', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
		});
		payment.confirm();
		repository.insert(payment);
		orderStatusPort.set('order-1', OrderStatus.COMPLETED);

		const useCase = new ReleasePaymentHoldUseCase(repository, orderStatusPort);
		await useCase.execute({ paymentId: 'payment-1' });

		const savedPayment = await repository.findById('payment-1');
		expect(savedPayment?.status).toBe('released');
	});

	it('throws when order is not completed', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const payment = Payment.create({
			id: 'payment-2',
			orderId: 'order-2',
			grossAmount: 100,
		});
		payment.confirm();
		repository.insert(payment);
		orderStatusPort.set('order-2', OrderStatus.IN_PROGRESS);

		const useCase = new ReleasePaymentHoldUseCase(repository, orderStatusPort);
		await expect(useCase.execute({ paymentId: 'payment-2' })).rejects.toThrow(
			'Payment hold can only be released after order completion.',
		);
	});

	it('is idempotent when payment is already released', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const payment = Payment.create({
			id: 'payment-3',
			orderId: 'order-3',
			grossAmount: 100,
		});
		payment.confirm();
		payment.releaseHold(OrderStatus.COMPLETED);
		repository.insert(payment);
		orderStatusPort.set('order-3', OrderStatus.COMPLETED);

		const useCase = new ReleasePaymentHoldUseCase(repository, orderStatusPort);
		await expect(
			useCase.execute({ paymentId: 'payment-3' }),
		).resolves.toBeUndefined();

		const savedPayment = await repository.findById('payment-3');
		expect(savedPayment?.status).toBe('released');
	});
});
