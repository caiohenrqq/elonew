import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentHoldReleaseNotAllowedError,
	PaymentNotFoundError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';

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

class InMemoryOrderStatusPort implements OrderStatusPort {
	private readonly orderStatuses = new Map<string, OrderStatus>();

	set(orderId: string, status: OrderStatus): void {
		this.orderStatuses.set(orderId, status);
	}

	async findByOrderId(orderId: string): Promise<OrderStatus | null> {
		return this.orderStatuses.get(orderId) ?? null;
	}

	async findByOrderIdForClient(orderId: string): Promise<OrderStatus | null> {
		return this.findByOrderId(orderId);
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
			paymentMethod: 'pix',
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
			paymentMethod: 'pix',
		});
		payment.confirm();
		repository.insert(payment);
		orderStatusPort.set('order-2', OrderStatus.IN_PROGRESS);

		const useCase = new ReleasePaymentHoldUseCase(repository, orderStatusPort);
		await expect(useCase.execute({ paymentId: 'payment-2' })).rejects.toThrow(
			PaymentHoldReleaseNotAllowedError,
		);
	});

	it('is idempotent when payment is already released', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const payment = Payment.create({
			id: 'payment-3',
			orderId: 'order-3',
			grossAmount: 100,
			paymentMethod: 'pix',
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

	it('throws when payment does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const useCase = new ReleasePaymentHoldUseCase(repository, orderStatusPort);

		await expect(
			useCase.execute({ paymentId: 'missing-payment' }),
		).rejects.toThrow(PaymentNotFoundError);
	});

	it('throws when order status does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const payment = Payment.create({
			id: 'payment-4',
			orderId: 'order-4',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		payment.confirm();
		repository.insert(payment);
		const useCase = new ReleasePaymentHoldUseCase(repository, orderStatusPort);

		await expect(useCase.execute({ paymentId: 'payment-4' })).rejects.toThrow(
			PaymentOrderNotFoundError,
		);
	});
});
