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

	async create(input: {
		clientId: string;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	}): Promise<{ id: string }> {
		const quote: StoredQuote = {
			id: `quote-${this.nextId++}`,
			clientId: input.clientId,
			requestDetails: input.requestDetails,
			pricing: input.pricing,
			expiresAt: input.expiresAt,
			consumedAt: null,
			orderId: null,
		};
		this.quotes.set(quote.id, quote);

		return { id: quote.id };
	}

	async consumeByIdForClient(input: {
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

		return {
			requestDetails: quote.requestDetails,
			pricing: quote.pricing,
		};
	}

	async restoreConsumedByIdForClient(input: {
		quoteId: string;
		clientId: string;
		orderId: string;
	}): Promise<void> {
		const quote = this.quotes.get(input.quoteId);
		if (!quote || quote.clientId !== input.clientId) return;
		if (quote.orderId !== input.orderId) return;

		quote.consumedAt = null;
		quote.orderId = null;
	}
}
