import type { OrderServiceType } from '@packages/shared/orders/service-type';

export const COUPON_LOOKUP_PORT_KEY = Symbol('COUPON_LOOKUP_PORT_KEY');

export type StoredCoupon = {
	id: string;
	code: string;
	discountType: 'percentage' | 'fixed';
	discount: number;
	isActive: boolean;
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

export interface CouponLookupPort {
	findByCode(code: string): Promise<StoredCoupon | null>;
	findById(id: string): Promise<StoredCoupon | null>;
	countConfirmedUsage(couponId: string): Promise<number>;
	countConfirmedUsageForClient(
		couponId: string,
		clientId: string,
	): Promise<number>;
}
