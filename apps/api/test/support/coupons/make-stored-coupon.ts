import type { StoredCoupon } from '@modules/orders/application/ports/coupon-lookup.port';

export function makeStoredCoupon(
	overrides: Partial<StoredCoupon> = {},
): StoredCoupon {
	return {
		id: 'coupon-1',
		code: 'WELCOME10',
		discountType: 'percentage',
		discount: 10,
		isActive: true,
		firstOrderOnly: false,
		allowedServiceTypes: [],
		allowedQueues: [],
		allowedEmails: [],
		minSubtotal: null,
		maxSubtotal: null,
		minRankIndex: null,
		maxRankIndex: null,
		minExtrasCount: null,
		requiredExtra: null,
		globalUsageLimit: null,
		perUserUsageLimit: null,
		...overrides,
	};
}
