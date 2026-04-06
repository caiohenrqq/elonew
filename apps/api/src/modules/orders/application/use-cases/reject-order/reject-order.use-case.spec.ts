import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import {
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();

	async create(order: Order): Promise<Order> {
		this.orders.set(order.id, order);
		return order;
	}

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async findByIdForClient(id: string): Promise<Order | null> {
		return this.findById(id);
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}

	insert(order: Order): void {
		this.orders.set(order.id, order);
	}
}

describe('RejectOrderUseCase', () => {
	it('keeps order pending booster when rejected by booster', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		order.confirmPayment();
		repository.insert(order);
		const useCase = new RejectOrderUseCase(repository);

		await useCase.execute({ orderId: 'order-1', boosterId: 'booster-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('pending_booster');
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new RejectOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'missing-order', boosterId: 'booster-1' }),
		).rejects.toThrow(OrderNotFoundError);
	});

	it('throws when order is not pending booster', async () => {
		const repository = new InMemoryOrderRepository();
		repository.insert(Order.create('order-2'));
		const useCase = new RejectOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-2', boosterId: 'booster-1' }),
		).rejects.toThrow(OrderInvalidTransitionError);
	});

	it('throws when a different booster tries to reject an assigned order', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-3', { boosterId: 'booster-1' });
		order.confirmPayment();
		repository.insert(order);
		const useCase = new RejectOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-3', boosterId: 'booster-2' }),
		).rejects.toThrow(OrderNotFoundError);
	});
});
