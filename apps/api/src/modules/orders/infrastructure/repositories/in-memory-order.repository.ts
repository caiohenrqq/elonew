import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';

export class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();
	private nextId = 1;

	async create(order: Order): Promise<Order> {
		const createdOrder = Order.rehydrate({
			id: order.id || `order-${this.nextId++}`,
			clientId: order.clientId,
			boosterId: order.boosterId,
			couponId: order.couponId,
			status: order.status,
			credentials: order.credentials,
			requestDetails: order.requestDetails,
			subtotal: order.subtotal,
			totalAmount: order.totalAmount,
			discountAmount: order.discountAmount,
			extras: order.extras,
		});
		this.orders.set(createdOrder.id, createdOrder);
		return createdOrder;
	}

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const order = this.orders.get(id) ?? null;
		if (!order || order.clientId !== clientId) return null;

		return order;
	}

	async existsForClient(clientId: string): Promise<boolean> {
		return Array.from(this.orders.values()).some(
			(order) => order.clientId === clientId,
		);
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}
}
