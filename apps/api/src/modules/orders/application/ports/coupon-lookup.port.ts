export const COUPON_LOOKUP_PORT_KEY = Symbol('COUPON_LOOKUP_PORT_KEY');

export type StoredCoupon = {
	id: string;
	code: string;
	discountType: 'percentage' | 'fixed';
	discount: number;
	isActive: boolean;
	firstOrderOnly: boolean;
};

export interface CouponLookupPort {
	findByCode(code: string): Promise<StoredCoupon | null>;
	findById(id: string): Promise<StoredCoupon | null>;
}
