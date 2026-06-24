import type { OrderStatus } from '@modules/orders/domain/order-status';

export const RATING_ORDER_LOOKUP_KEY = Symbol('RATING_ORDER_LOOKUP_KEY');

export type RatableOrder = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	status: OrderStatus;
	completedAt: Date | null;
};

export interface RatingOrderLookupPort {
	findById(orderId: string): Promise<RatableOrder | null>;
}
