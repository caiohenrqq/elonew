import {
	type CouponEligibilityContext,
	evaluateCouponEligibility,
} from '@modules/orders/application/coupon-eligibility';
import type {
	OrderPricingSnapshot,
	OrderQuoteRequestDetails,
} from '@modules/orders/application/order-pricing';
import {
	COUPON_EVENT_RECORDER_KEY,
	type CouponEventRecorderPort,
} from '@modules/orders/application/ports/coupon-event-recorder.port';
import {
	COUPON_LOOKUP_PORT_KEY,
	type CouponLookupPort,
	type StoredCoupon,
} from '@modules/orders/application/ports/coupon-lookup.port';
import {
	ORDER_CLIENT_READER_KEY,
	type OrderClientReaderPort,
} from '@modules/orders/application/ports/order-client-reader.port';
import {
	type CouponInvalidReason,
	OrderCouponInvalidError,
} from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';
import { COUPON_MIN_ORDER_TOTAL_CENTS } from '@packages/shared/coupons/coupon';
import { Money } from '@packages/shared/money/money';
import { findOrderRankIndex } from '@packages/shared/orders/order-rank-progression';

export const ORDER_COUPON_SERVICE_KEY = Symbol('ORDER_COUPON_SERVICE_KEY');

export type ApplyOrderCouponInput = {
	clientId: string;
	couponCode?: string;
	pricing: OrderPricingSnapshot;
	requestDetails: OrderQuoteRequestDetails;
	emitEvents?: boolean;
};

export interface OrderCouponService {
	apply(input: ApplyOrderCouponInput): Promise<{
		couponId: string | null;
		pricing: OrderPricingSnapshot;
	}>;
}

type FailureKind =
	| 'validation_failed'
	| 'eligibility_failed'
	| 'usage_limit_failed';

@Injectable()
export class ApplyOrderCouponService implements OrderCouponService {
	constructor(
		@Inject(COUPON_LOOKUP_PORT_KEY)
		private readonly couponLookup: CouponLookupPort,
		@Inject(ORDER_CLIENT_READER_KEY)
		private readonly clientReader: OrderClientReaderPort,
		@Inject(COUPON_EVENT_RECORDER_KEY)
		private readonly events: CouponEventRecorderPort,
	) {}

	async apply(input: ApplyOrderCouponInput): Promise<{
		couponId: string | null;
		pricing: OrderPricingSnapshot;
	}> {
		if (!input.couponCode) return { couponId: null, pricing: input.pricing };

		const code = input.couponCode.trim().toUpperCase();
		const coupon = await this.couponLookup.findByCode(code);

		if (!coupon)
			return this.reject(input, code, null, 'validation_failed', 'not_found');
		if (!coupon.isActive)
			return this.reject(
				input,
				code,
				coupon.id,
				'validation_failed',
				'inactive',
			);
		if (!this.hasValidDiscount(coupon))
			return this.reject(
				input,
				code,
				coupon.id,
				'validation_failed',
				'discount_invalid',
			);

		const eligibility = evaluateCouponEligibility(
			coupon,
			await this.buildContext(input, coupon),
		);
		if (!eligibility.ok)
			return this.reject(
				input,
				code,
				coupon.id,
				'eligibility_failed',
				eligibility.reason,
			);

		const usageLimitReason = await this.usageLimitReason(
			coupon,
			input.clientId,
		);
		if (usageLimitReason)
			return this.reject(
				input,
				code,
				coupon.id,
				'usage_limit_failed',
				usageLimitReason,
			);

		const pricing = this.applyDiscount(coupon, input.pricing);
		if (input.emitEvents)
			await this.events.record({
				type: 'applied_at_checkout',
				code,
				couponId: coupon.id,
				clientId: input.clientId,
			});

		return { couponId: coupon.id, pricing };
	}

	private hasValidDiscount(coupon: StoredCoupon): boolean {
		return Number.isFinite(coupon.discount) && coupon.discount > 0;
	}

	private async buildContext(
		input: ApplyOrderCouponInput,
		coupon: StoredCoupon,
	): Promise<CouponEligibilityContext> {
		const clientEmail =
			coupon.allowedEmails.length > 0
				? ((await this.clientReader.findEmailById(input.clientId)) ?? '')
				: '';
		const isFirstPaidOrder = coupon.firstOrderOnly
			? !(await this.clientReader.hasPaidOrder(input.clientId))
			: true;

		return {
			clientEmail,
			isFirstPaidOrder,
			serviceType: input.requestDetails.serviceType,
			desiredQueue: input.requestDetails.desiredQueue,
			rankIndex: findOrderRankIndex(
				input.requestDetails.currentLeague,
				input.requestDetails.currentDivision,
			),
			selectedExtras: input.pricing.extras.map((extra) => extra.type),
			subtotal: input.pricing.subtotal,
		};
	}

	// ponytail: usage is counted only at payment confirmation (PM decision), so
	// this checkout-time check cannot be atomic against concurrent payments — two
	// near-limit checkouts can both pay and slightly oversubscribe a limit. That
	// is the accepted trade-off of count-after-payment; the alternative (reserving
	// a slot at checkout with expiry) was explicitly out of scope. If hard caps
	// ever become a requirement, enforce a reservation here instead.
	private async usageLimitReason(
		coupon: StoredCoupon,
		clientId: string,
	): Promise<CouponInvalidReason | null> {
		if (coupon.globalUsageLimit !== null) {
			const used = await this.couponLookup.countConfirmedUsage(coupon.id);
			if (used >= coupon.globalUsageLimit) return 'global_usage_limit_reached';
		}
		if (coupon.perUserUsageLimit !== null) {
			const used = await this.couponLookup.countConfirmedUsageForClient(
				coupon.id,
				clientId,
			);
			if (used >= coupon.perUserUsageLimit)
				return 'per_user_usage_limit_reached';
		}
		return null;
	}

	private applyDiscount(
		coupon: StoredCoupon,
		pricing: OrderPricingSnapshot,
	): OrderPricingSnapshot {
		const subtotal = Money.fromCents(pricing.subtotal);
		const rawDiscount =
			coupon.discountType === 'percentage'
				? subtotal.percentage(coupon.discount / 100)
				: Money.fromDecimal(coupon.discount);
		const maxDiscount = Money.zero().max(
			subtotal.subtract(Money.fromCents(COUPON_MIN_ORDER_TOTAL_CENTS)),
		);
		const discount = rawDiscount.min(maxDiscount);

		return {
			pricingVersionId: pricing.pricingVersionId,
			subtotal: pricing.subtotal,
			totalAmount: subtotal.subtract(discount).cents,
			discountAmount: discount.cents,
			extras: pricing.extras,
		};
	}

	private async reject(
		input: ApplyOrderCouponInput,
		code: string,
		couponId: string | null,
		kind: FailureKind,
		reason: CouponInvalidReason,
	): Promise<never> {
		if (input.emitEvents)
			await this.events.record({
				type: kind,
				code,
				couponId,
				clientId: input.clientId,
				reason,
			});
		throw new OrderCouponInvalidError(reason);
	}
}
