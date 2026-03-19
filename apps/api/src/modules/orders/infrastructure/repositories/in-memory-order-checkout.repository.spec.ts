import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';
import type { OrderQuoteRepositoryPort } from '@modules/orders/application/ports/order-quote-repository.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderQuoteAlreadyUsedError } from '@modules/orders/domain/order-pricing.errors';
import { InMemoryOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-checkout.repository';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();
	public shouldFailCreate = false;

	async create(order: Order): Promise<Order> {
		if (this.shouldFailCreate) throw new Error('create failed');

		const createdOrder = Order.rehydrate({
			id: order.id,
			clientId: order.clientId,
			boosterId: order.boosterId,
			status: order.status,
			requestDetails: order.requestDetails,
			subtotal: order.subtotal,
			totalAmount: order.totalAmount,
			discountAmount: order.discountAmount,
		});
		this.orders.set(createdOrder.id, createdOrder);
		return createdOrder;
	}

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const order = this.orders.get(id) ?? null;
		if (!order || order.clientId !== clientId) return null;

		return order;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}
}

type StoredQuote = {
	id: string;
	clientId: string;
	requestDetails: OrderQuoteSnapshot['requestDetails'];
	pricing: OrderQuoteSnapshot['pricing'];
	expiresAt: Date;
	consumedAt: Date | null;
	orderId: string | null;
};

class InMemoryOrderQuoteRepository implements OrderQuoteRepositoryPort {
	private readonly quotes = new Map<string, StoredQuote>();

	async create(_: {
		clientId: string;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	}): Promise<{ id: string }> {
		return { id: 'unused' };
	}

	async consumeByIdForClient(input: {
		quoteId: string;
		clientId: string;
		now: Date;
		orderId: string;
	}): Promise<OrderQuoteSnapshot> {
		const quote = this.quotes.get(input.quoteId);
		if (!quote || quote.clientId !== input.clientId)
			throw new Error('missing quote');
		if (quote.consumedAt) throw new OrderQuoteAlreadyUsedError();

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

	insert(quote: StoredQuote): void {
		this.quotes.set(quote.id, quote);
	}

	getById(id: string): StoredQuote | undefined {
		return this.quotes.get(id);
	}
}

function makeQuote(): StoredQuote {
	return {
		id: 'quote-1',
		clientId: 'client-1',
		requestDetails: {
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: new Date('2026-03-31T00:00:00.000Z'),
		},
		pricing: {
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		},
		expiresAt: new Date('2026-03-31T00:00:00.000Z'),
		consumedAt: null,
		orderId: null,
	};
}

describe('InMemoryOrderCheckoutRepository', () => {
	it('creates an order and keeps the quote linked to that order id', async () => {
		const orderRepository = new InMemoryOrderRepository();
		const quoteRepository = new InMemoryOrderQuoteRepository();
		quoteRepository.insert(makeQuote());
		const repository = new InMemoryOrderCheckoutRepository(
			orderRepository,
			quoteRepository,
		);

		const createdOrder = await repository.createDraftOrderFromOwnedQuote({
			orderId: 'order-1',
			clientId: 'client-1',
			quoteId: 'quote-1',
			now: new Date('2026-03-18T12:00:00.000Z'),
		});

		expect(createdOrder.id).toBe('order-1');
		expect(quoteRepository.getById('quote-1')).toMatchObject({
			consumedAt: new Date('2026-03-18T12:00:00.000Z'),
			orderId: 'order-1',
		});
	});

	it('restores the quote when order creation fails after consumption', async () => {
		const orderRepository = new InMemoryOrderRepository();
		orderRepository.shouldFailCreate = true;
		const quoteRepository = new InMemoryOrderQuoteRepository();
		quoteRepository.insert(makeQuote());
		const repository = new InMemoryOrderCheckoutRepository(
			orderRepository,
			quoteRepository,
		);

		await expect(
			repository.createDraftOrderFromOwnedQuote({
				orderId: 'order-1',
				clientId: 'client-1',
				quoteId: 'quote-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
			}),
		).rejects.toThrow('create failed');

		expect(quoteRepository.getById('quote-1')).toMatchObject({
			consumedAt: null,
			orderId: null,
		});
	});
});
