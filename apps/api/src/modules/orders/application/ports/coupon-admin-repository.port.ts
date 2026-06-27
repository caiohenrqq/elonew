import type { StoredCoupon } from '@modules/orders/application/ports/coupon-lookup.port';
import type { CouponEventType } from '@packages/shared/coupons/coupon';
import type { OrderServiceType } from '@packages/shared/orders/service-type';

export const COUPON_ADMIN_REPOSITORY_KEY = Symbol(
	'COUPON_ADMIN_REPOSITORY_KEY',
);

export type CouponPersistenceInput = {
	code: string;
	discountType: 'percentage' | 'fixed';
	discount: number;
	firstOrderOnly: boolean;
	allowedServiceTypes: OrderServiceType[];
	allowedQueues: string[];
	allowedEmails: string[];
	minSubtotal: number | null;
	maxSubtotal: number | null;
	minRankIndex: number | null;
	maxRankIndex: number | null;
	minExtrasCount: number | null;
	requiredExtra: string | null;
	globalUsageLimit: number | null;
	perUserUsageLimit: number | null;
};

export type CouponSummary = StoredCoupon & {
	createdAt: Date;
	usageCount: number;
};

export type CouponReport = {
	couponId: string;
	code: string;
	usageCount: number;
	discountTotalCents: number;
	revenueCents: number;
	uniqueClients: number;
	appliedCount: number;
	conversionRate: number;
	eventCounts: Record<CouponEventType, number>;
};

export interface CouponAdminRepositoryPort {
	existsByCode(code: string): Promise<boolean>;
	create(
		input: CouponPersistenceInput,
		adminUserId: string,
	): Promise<{ id: string; code: string }>;
	list(): Promise<CouponSummary[]>;
	findById(id: string): Promise<CouponSummary | null>;
	disable(id: string, adminUserId: string): Promise<boolean>;
	getReport(couponId: string): Promise<CouponReport | null>;
}
