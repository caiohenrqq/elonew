import {
	COUPON_LOOKUP_PORT_KEY,
	type CouponLookupPort,
} from '@modules/orders/application/ports/coupon-lookup.port';
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
import { OrderCouponInvalidError } from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryOrderCheckoutRepository implements OrderCheckoutPort {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Inject(ORDER_QUOTE_REPOSITORY_KEY)
		private readonly orderQuoteRepository: OrderQuoteRepositoryPort,
		@Inject(COUPON_LOOKUP_PORT_KEY)
		private readonly couponLookup: CouponLookupPort,
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
			await this.validateCouponForCheckout({
				clientId: input.clientId,
				couponId: quote.couponId,
			});

			return await this.orderRepository.create(
				Order.createDraft({
					id: input.orderId,
					clientId: input.clientId,
					boosterId: input.boosterId,
					couponId: quote.couponId,
					pricingVersionId: quote.pricing.pricingVersionId,
					requestDetails: quote.requestDetails,
					pricing: {
						...quote.pricing,
						extras: quote.pricing.extras,
					},
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

	private async validateCouponForCheckout(input: {
		clientId: string;
		couponId: string | null;
	}): Promise<void> {
		if (!input.couponId) return;

		const coupon = await this.couponLookup.findById(input.couponId);
		if (!coupon) throw new OrderCouponInvalidError();
		if (!coupon.isActive) throw new OrderCouponInvalidError();
		if (!Number.isFinite(coupon.discount) || coupon.discount < 0)
			throw new OrderCouponInvalidError();
		if (coupon.discountType !== 'percentage' && coupon.discountType !== 'fixed')
			throw new OrderCouponInvalidError();
		if (!coupon.firstOrderOnly) return;
		if (await this.orderRepository.existsForClient?.(input.clientId))
			throw new OrderCouponInvalidError();
	}
}
