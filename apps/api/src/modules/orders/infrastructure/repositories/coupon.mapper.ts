import type { StoredCoupon } from '@modules/orders/application/ports/coupon-lookup.port';
import { mapServiceTypeToDomain } from '@modules/orders/infrastructure/repositories/service-type.mapper';
import { type Coupon, CouponDiscountType } from '@prisma/client';

export function mapStoredCoupon(record: Coupon): StoredCoupon {
	return {
		id: record.id,
		code: record.code,
		discountType:
			record.discountType === CouponDiscountType.PERCENTAGE
				? 'percentage'
				: 'fixed',
		discount: record.discount,
		isActive: record.isActive,
		firstOrderOnly: record.firstOrderOnly,
		allowedServiceTypes: (record.allowedServiceTypes ?? []).map(
			mapServiceTypeToDomain,
		),
		allowedQueues: record.allowedQueues ?? [],
		allowedEmails: record.allowedEmails ?? [],
		minSubtotal: record.minSubtotal,
		maxSubtotal: record.maxSubtotal,
		minRankIndex: record.minRankIndex,
		maxRankIndex: record.maxRankIndex,
		minExtrasCount: record.minExtrasCount,
		requiredExtra: record.requiredExtra,
		globalUsageLimit: record.globalUsageLimit,
		perUserUsageLimit: record.perUserUsageLimit,
	};
}
