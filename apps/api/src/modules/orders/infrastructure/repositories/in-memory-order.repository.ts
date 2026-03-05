import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';

export class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}
}
