import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';

export const ORDER_QUOTE_REPOSITORY_KEY = Symbol('ORDER_QUOTE_REPOSITORY_KEY');

export interface OrderQuoteRepositoryPort {
	create(input: {
		clientId: string;
		couponId: string | null;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	}): Promise<{ id: string }>;
	consumeByIdForClient(input: {
		quoteId: string;
		clientId: string;
		now: Date;
		orderId: string;
	}): Promise<OrderQuoteSnapshot>;
	restoreConsumedByIdForClient(input: {
		quoteId: string;
		clientId: string;
		orderId: string;
	}): Promise<void>;
}
