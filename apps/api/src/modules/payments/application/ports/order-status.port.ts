import type { OrderStatus } from '@modules/orders/domain/order-status';

export const ORDER_STATUS_PORT_KEY = Symbol('ORDER_STATUS_PORT_KEY');

export interface OrderStatusPort {
	findByOrderId(orderId: string): Promise<OrderStatus | null>;
	findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<OrderStatus | null>;
}
