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

	async findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const order = this.orders.get(id) ?? null;
		if (!order || order.clientId !== clientId) return null;

		return order;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}

	insert(order: Order): void {
		this.orders.set(order.id, order);
	}
}

describe('GetOrderUseCase', () => {
	it('returns the owned order summary when the order exists', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: 'awaiting_payment' as never,
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		repository.insert(order);

		const useCase = new GetOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).resolves.toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
	});

	it('throws when the order belongs to another client', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-2',
			status: 'awaiting_payment' as never,
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		repository.insert(order);
		const useCase = new GetOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(OrderNotFoundError);
	});
});
