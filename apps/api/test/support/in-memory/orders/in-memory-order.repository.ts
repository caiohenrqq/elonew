import type {
	ClientOrderDashboardSnapshot,
	ClientOrderReaderPort,
} from '@modules/orders/application/ports/client-order-reader.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';

export class InMemoryOrderRepository
	implements OrderRepositoryPort, ClientOrderReaderPort
{
	private readonly orders = new Map<string, Order>();
	private readonly createdAtByOrderId = new Map<string, Date>();
	private nextId = 1;
	private nextCreatedAtOffset = 0;

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
		this.createdAtByOrderId.set(
			createdOrder.id,
			new Date(Date.UTC(2026, 3, 1, 0, 0, this.nextCreatedAtOffset++)),
		);
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

	findRecentForClient(
		clientId: string,
		limit: number,
	): Promise<ClientOrderDashboardSnapshot[]> {
		return Promise.resolve(
			Array.from(this.orders.values())
				.filter((order) => order.clientId === clientId)
				.sort(
					(left, right) =>
						this.getCreatedAt(right.id).getTime() -
						this.getCreatedAt(left.id).getTime(),
				)
				.slice(0, limit)
				.map((order) => this.mapDashboardSnapshot(order)),
		);
	}

	countActiveForClient(clientId: string): Promise<number> {
		const activeStatuses = new Set<OrderStatus>([
			OrderStatus.AWAITING_PAYMENT,
			OrderStatus.PENDING_BOOSTER,
			OrderStatus.IN_PROGRESS,
		]);

		return Promise.resolve(
			Array.from(this.orders.values()).filter(
				(order) =>
					order.clientId === clientId && activeStatuses.has(order.status),
			).length,
		);
	}

	countForClient(clientId: string): Promise<number> {
		return Promise.resolve(
			Array.from(this.orders.values()).filter(
				(order) => order.clientId === clientId,
			).length,
		);
	}

	sumTotalAmountForClient(clientId: string): Promise<number> {
		return Promise.resolve(
			Array.from(this.orders.values())
				.filter((order) => order.clientId === clientId)
				.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
		);
	}

	save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
		if (!this.createdAtByOrderId.has(order.id)) {
			this.createdAtByOrderId.set(
				order.id,
				new Date(Date.UTC(2026, 3, 1, 0, 0, this.nextCreatedAtOffset++)),
			);
		}
		return Promise.resolve();
	}

	async saveBoosterRejection(order: Order): Promise<void> {
		await this.save(order);
	}

	private mapDashboardSnapshot(order: Order): ClientOrderDashboardSnapshot {
		return {
			id: order.id,
			clientId: order.clientId,
			status: order.status,
			serviceType: order.requestDetails?.serviceType ?? null,
			currentLeague: order.requestDetails?.currentLeague ?? null,
			currentDivision: order.requestDetails?.currentDivision ?? null,
			currentLp: order.requestDetails?.currentLp ?? null,
			desiredLeague: order.requestDetails?.desiredLeague ?? null,
			desiredDivision: order.requestDetails?.desiredDivision ?? null,
			server: order.requestDetails?.server ?? null,
			desiredQueue: order.requestDetails?.desiredQueue ?? null,
			lpGain: order.requestDetails?.lpGain ?? null,
			deadline: order.requestDetails?.deadline ?? null,
			subtotal: order.subtotal,
			totalAmount: order.totalAmount,
			discountAmount: order.discountAmount,
			createdAt: this.getCreatedAt(order.id),
		};
	}

	private getCreatedAt(orderId: string): Date {
		return (
			this.createdAtByOrderId.get(orderId) ??
			new Date(Date.UTC(2026, 3, 1, 0, 0, 0))
		);
	}
}
