import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';

export class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();
	private nextId = 1;

	create(order: Order): Promise<Order> {
		const createdOrder = Order.rehydrate({
			id: order.id || `order-${this.nextId++}`,
			clientId: order.clientId,
			boosterId: order.boosterId,
			couponId: order.couponId,
			pricingVersionId: order.pricingVersionId,
			status: order.status,
			credentials: order.credentials,
			requestDetails: order.requestDetails,
			subtotal: order.subtotal,
			totalAmount: order.totalAmount,
			discountAmount: order.discountAmount,
			extras: order.extras,
		});
		this.orders.set(createdOrder.id, createdOrder);
		return Promise.resolve(createdOrder);
	}

	findById(id: string): Promise<Order | null> {
		return Promise.resolve(this.orders.get(id) ?? null);
	}

	findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const order = this.orders.get(id) ?? null;
		if (!order || order.clientId !== clientId) return Promise.resolve(null);

		return Promise.resolve(order);
	}

	existsForClient(clientId: string): Promise<boolean> {
		return Promise.resolve(
			Array.from(this.orders.values()).some(
				(order) => order.clientId === clientId,
			),
		);
	}

	save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
		return Promise.resolve();
	}
}
