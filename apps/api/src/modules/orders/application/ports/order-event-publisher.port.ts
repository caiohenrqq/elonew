export const ORDER_EVENT_PUBLISHER_KEY = Symbol('ORDER_EVENT_PUBLISHER_KEY');

export type OrderEventType =
	| 'order.paid'
	| 'order.accepted'
	| 'order.rejected'
	| 'order.completed'
	| 'order.cancelled';

export type OrderEvent = {
	id: string;
	type: OrderEventType;
	orderId: string;
	clientId: string | null;
	boosterId: string | null;
	occurredAt: string;
};

export interface OrderEventPublisherPort {
	publish(event: OrderEvent): Promise<void>;
}
