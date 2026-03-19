import type { OrderCheckoutPort } from '@modules/orders/application/ports/order-checkout.port';
import {
	ORDER_QUOTE_REPOSITORY_KEY,
	type OrderQuoteRepositoryPort,
} from '@modules/orders/application/ports/order-quote-repository.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryOrderCheckoutRepository implements OrderCheckoutPort {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Inject(ORDER_QUOTE_REPOSITORY_KEY)
		private readonly orderQuoteRepository: OrderQuoteRepositoryPort,
	) {}

	async createDraftOrderFromOwnedQuote(input: {
		orderId: string;
		clientId: string;
		boosterId?: string;
		quoteId: string;
		now: Date;
	}) {
		const quote = await this.orderQuoteRepository.consumeByIdForClient({
			quoteId: input.quoteId,
			clientId: input.clientId,
			now: input.now,
			orderId: input.orderId,
		});

		try {
			return await this.orderRepository.create(
				Order.createDraft({
					id: input.orderId,
					clientId: input.clientId,
					boosterId: input.boosterId,
					requestDetails: quote.requestDetails,
					pricing: quote.pricing,
				}),
			);
		} catch (error) {
			await this.orderQuoteRepository.restoreConsumedByIdForClient({
				quoteId: input.quoteId,
				clientId: input.clientId,
				orderId: input.orderId,
			});
			throw error;
		}
	}
}
