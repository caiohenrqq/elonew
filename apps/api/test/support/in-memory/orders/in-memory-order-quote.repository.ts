import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';
import type { OrderQuoteRepositoryPort } from '@modules/orders/application/ports/order-quote-repository.port';
import {
	OrderQuoteAlreadyUsedError,
	OrderQuoteExpiredError,
	OrderQuoteNotFoundError,
} from '@modules/orders/domain/order-pricing.errors';
import { Injectable } from '@nestjs/common';

type StoredQuote = {
	id: string;
	clientId: string;
	couponId: string | null;
	requestDetails: OrderQuoteSnapshot['requestDetails'];
	pricing: OrderQuoteSnapshot['pricing'];
	expiresAt: Date;
	consumedAt: Date | null;
	orderId: string | null;
};

@Injectable()
export class InMemoryOrderQuoteRepository implements OrderQuoteRepositoryPort {
	private readonly quotes = new Map<string, StoredQuote>();
	private nextId = 1;

	create(input: {
		clientId: string;
		couponId: string | null;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	}): Promise<{ id: string }> {
		const quote: StoredQuote = {
			id: `quote-${this.nextId++}`,
			clientId: input.clientId,
			couponId: input.couponId,
			requestDetails: input.requestDetails,
			pricing: input.pricing,
			expiresAt: input.expiresAt,
			consumedAt: null,
			orderId: null,
		};
		this.quotes.set(quote.id, quote);

		return Promise.resolve({ id: quote.id });
	}

	consumeByIdForClient(input: {
		quoteId: string;
		clientId: string;
		now: Date;
		orderId: string;
	}): Promise<OrderQuoteSnapshot> {
		const quote = this.quotes.get(input.quoteId);
		if (!quote || quote.clientId !== input.clientId)
			throw new OrderQuoteNotFoundError();
		if (quote.consumedAt) throw new OrderQuoteAlreadyUsedError();
		if (quote.expiresAt <= input.now) throw new OrderQuoteExpiredError();

		quote.consumedAt = input.now;
		quote.orderId = input.orderId;

		return Promise.resolve({
			couponId: quote.couponId,
			requestDetails: quote.requestDetails,
			pricing: quote.pricing,
		});
	}

	restoreConsumedByIdForClient(input: {
		quoteId: string;
		clientId: string;
		orderId: string;
	}): Promise<void> {
		const quote = this.quotes.get(input.quoteId);
		if (!quote || quote.clientId !== input.clientId) return Promise.resolve();
		if (quote.orderId !== input.orderId) return Promise.resolve();

		quote.consumedAt = null;
		quote.orderId = null;
		return Promise.resolve();
	}
}
