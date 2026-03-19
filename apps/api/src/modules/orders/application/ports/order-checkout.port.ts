import { Order } from '@modules/orders/domain/order.entity';

export const ORDER_CHECKOUT_PORT_KEY = Symbol('ORDER_CHECKOUT_PORT_KEY');

export interface OrderCheckoutPort {
	createDraftOrderFromOwnedQuote(input: {
		orderId: string;
		clientId: string;
		boosterId?: string;
		quoteId: string;
		now: Date;
	}): Promise<Order>;
}
