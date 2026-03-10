import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';

export class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();
	private nextId = 1;

	async create(order: Order): Promise<Order> {
		const createdOrder = Order.rehydrate({
			id: `order-${this.nextId++}`,
			clientId: order.clientId,
			boosterId: order.boosterId,
			status: order.status,
			credentials: order.credentials,
			requestDetails: order.requestDetails,
		});
		this.orders.set(createdOrder.id, createdOrder);
		return createdOrder;
	}

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}
}
