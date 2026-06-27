import type { StoredCoupon } from '@modules/orders/application/ports/coupon-lookup.port';
import type { OrderServiceType } from '@packages/shared/orders/service-type';

export type CouponEligibilityContext = {
	clientEmail: string;
	isFirstPaidOrder: boolean;
	serviceType: OrderServiceType;
	desiredQueue: string;
	rankIndex: number;
	selectedExtras: string[];
	subtotal: number;
};

export type CouponEligibilityResult =
	| { ok: true }
	| { ok: false; reason: string };

export function evaluateCouponEligibility(
	coupon: StoredCoupon,
	context: CouponEligibilityContext,
): CouponEligibilityResult {
	if (coupon.firstOrderOnly && !context.isFirstPaidOrder)
		return fail('not_first_order');

	if (
		coupon.allowedServiceTypes.length > 0 &&
		!coupon.allowedServiceTypes.includes(context.serviceType)
	)
		return fail('service_type_not_allowed');

	if (
		coupon.allowedQueues.length > 0 &&
		!coupon.allowedQueues.includes(context.desiredQueue)
	)
		return fail('queue_not_allowed');

	if (
		coupon.allowedEmails.length > 0 &&
		!coupon.allowedEmails.includes(context.clientEmail.trim().toLowerCase())
	)
		return fail('email_not_allowed');

	if (coupon.minSubtotal !== null && context.subtotal < coupon.minSubtotal)
		return fail('subtotal_below_minimum');

	if (coupon.maxSubtotal !== null && context.subtotal > coupon.maxSubtotal)
		return fail('subtotal_above_maximum');

	if (coupon.minRankIndex !== null && context.rankIndex < coupon.minRankIndex)
		return fail('rank_below_minimum');

	if (coupon.maxRankIndex !== null && context.rankIndex > coupon.maxRankIndex)
		return fail('rank_above_maximum');

	if (
		coupon.minExtrasCount !== null &&
		context.selectedExtras.length < coupon.minExtrasCount
	)
		return fail('not_enough_extras');

	if (
		coupon.requiredExtra !== null &&
		!context.selectedExtras.includes(coupon.requiredExtra)
	)
		return fail('required_extra_missing');

	return { ok: true };
}

function fail(reason: string): CouponEligibilityResult {
	return { ok: false, reason };
}
