import type { OrderPricingSnapshot } from '@modules/orders/application/order-pricing';
import {
	COUPON_LOOKUP_PORT_KEY,
	type CouponLookupPort,
} from '@modules/orders/application/ports/coupon-lookup.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderCouponInvalidError } from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';

export const ORDER_COUPON_SERVICE_KEY = Symbol('ORDER_COUPON_SERVICE_KEY');

export interface OrderCouponService {
	apply(input: {
		clientId: string;
		couponCode?: string;
		pricing: OrderPricingSnapshot;
	}): Promise<{
		couponId: string | null;
		pricing: OrderPricingSnapshot;
	}>;
}

@Injectable()
export class ApplyOrderCouponService implements OrderCouponService {
	constructor(
		@Inject(COUPON_LOOKUP_PORT_KEY)
		private readonly couponLookup: CouponLookupPort,
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async apply(input: {
		clientId: string;
		couponCode?: string;
		pricing: OrderPricingSnapshot;
	}): Promise<{
		couponId: string | null;
		pricing: OrderPricingSnapshot;
	}> {
		if (!input.couponCode) {
			return {
				couponId: null,
				pricing: input.pricing,
			};
		}

		const coupon = await this.couponLookup.findByCode(input.couponCode);
		if (!coupon) throw new OrderCouponInvalidError();
		if (!coupon.isActive) throw new OrderCouponInvalidError();
		if (!Number.isFinite(coupon.discount) || coupon.discount < 0)
			throw new OrderCouponInvalidError();
		if (
			coupon.firstOrderOnly &&
			(await this.orderRepository.existsForClient?.(input.clientId))
		)
			throw new OrderCouponInvalidError();

		const rawDiscount =
			coupon.discountType === 'percentage'
				? input.pricing.subtotal * (coupon.discount / 100)
				: coupon.discount;
		const discountAmount = Number(
			Math.min(input.pricing.subtotal, rawDiscount).toFixed(2),
		);
		const totalAmount = Number(
			Math.max(0, input.pricing.subtotal - discountAmount).toFixed(2),
		);

		return {
			couponId: coupon.id,
			pricing: {
				pricingVersionId: input.pricing.pricingVersionId,
				subtotal: input.pricing.subtotal,
				totalAmount,
				discountAmount,
				extras: input.pricing.extras,
			},
		};
	}
}
