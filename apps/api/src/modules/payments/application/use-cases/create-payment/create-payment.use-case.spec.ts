import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentAlreadyExistsError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';

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

describe('CreatePaymentUseCase', () => {
	it('creates a payment with hold lifecycle & 70% booster amount', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		orderStatusPort.set('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new CreatePaymentUseCase(repository, orderStatusPort);

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
		const orderStatusPort = new InMemoryOrderStatusPort();
		orderStatusPort.set('order-2', OrderStatus.AWAITING_PAYMENT);
		await repository.save(
			Payment.create({
				id: 'payment-1',
				orderId: 'order-1',
				grossAmount: 100,
			}),
		);

		const useCase = new CreatePaymentUseCase(repository, orderStatusPort);
		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				orderId: 'order-2',
				grossAmount: 40,
			}),
		).rejects.toThrow(PaymentAlreadyExistsError);
	});

	it('throws when related order does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const useCase = new CreatePaymentUseCase(repository, orderStatusPort);

		await expect(
			useCase.execute({
				paymentId: 'payment-missing-order',
				orderId: 'missing-order',
				grossAmount: 50,
			}),
		).rejects.toThrow(PaymentOrderNotFoundError);
	});
});
