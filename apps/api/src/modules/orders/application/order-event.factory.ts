import { randomUUID } from 'node:crypto';
import type {
	OrderEvent,
	OrderEventType,
} from '@modules/orders/application/ports/order-event-publisher.port';
import type { Order } from '@modules/orders/domain/order.entity';

export const createOrderEvent = (
	type: OrderEventType,
	order: Order,
	input?: {
		boosterId?: string | null;
		occurredAt?: Date;
	},
): OrderEvent => ({
	id: randomUUID(),
	type,
	orderId: order.id,
	clientId: order.clientId,
	boosterId:
		input && 'boosterId' in input ? (input.boosterId ?? null) : order.boosterId,
	occurredAt: (input?.occurredAt ?? new Date()).toISOString(),
});
