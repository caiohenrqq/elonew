import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';

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

describe('GetOrderUseCase', () => {
	it('returns the order summary when the order exists', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		repository.insert(order);

		const useCase = new GetOrderUseCase(repository);

		await expect(useCase.execute({ orderId: 'order-1' })).resolves.toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
		});
	});

	it('throws when the order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new GetOrderUseCase(repository);

		await expect(useCase.execute({ orderId: 'missing-order' })).rejects.toThrow(
			OrderNotFoundError,
		);
	});
});
