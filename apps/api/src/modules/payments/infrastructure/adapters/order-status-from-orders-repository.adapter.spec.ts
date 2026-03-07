import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderStatusFromOrdersRepositoryAdapter } from '@modules/payments/infrastructure/adapters/order-status-from-orders-repository.adapter';

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

describe('OrderStatusFromOrdersRepositoryAdapter', () => {
	it('returns order status when order exists', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		order.confirmPayment();
		repository.insert(order);
		const adapter = new OrderStatusFromOrdersRepositoryAdapter(repository);

		await expect(adapter.findByOrderId('order-1')).resolves.toBe(
			'pending_booster',
		);
	});

	it('returns null when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const adapter = new OrderStatusFromOrdersRepositoryAdapter(repository);

		await expect(adapter.findByOrderId('missing-order')).resolves.toBeNull();
	});
});
