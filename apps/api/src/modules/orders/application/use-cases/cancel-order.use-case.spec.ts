import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();

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

describe('CancelOrderUseCase', () => {
	it('cancels an order when cancellation is allowed', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		order.confirmPayment();
		repository.insert(order);

		const useCase = new CancelOrderUseCase(repository);

		await useCase.execute({ orderId: 'order-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('cancelled');
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new CancelOrderUseCase(repository);

		await expect(useCase.execute({ orderId: 'missing-order' })).rejects.toThrow(
			'Order not found.',
		);
	});
});
