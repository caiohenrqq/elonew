import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
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

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}

	insert(order: Order): void {
		this.orders.set(order.id, order);
	}
}

describe('AcceptOrderUseCase', () => {
	it('moves order to in progress when booster accepts a paid order', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		order.confirmPayment();
		repository.insert(order);

		const useCase = new AcceptOrderUseCase(repository);
		await useCase.execute({ orderId: 'order-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('in_progress');
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new AcceptOrderUseCase(repository);

		await expect(useCase.execute({ orderId: 'missing-order' })).rejects.toThrow(
			OrderNotFoundError,
		);
	});

	it('throws when order has not been paid yet', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-2');
		repository.insert(order);

		const useCase = new AcceptOrderUseCase(repository);

		await expect(useCase.execute({ orderId: 'order-2' })).rejects.toThrow(
			OrderInvalidTransitionError,
		);
	});
});
