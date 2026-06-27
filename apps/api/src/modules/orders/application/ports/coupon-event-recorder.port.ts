import type { CouponEventType } from '@packages/shared/coupons/coupon';

export const COUPON_EVENT_RECORDER_KEY = Symbol('COUPON_EVENT_RECORDER_KEY');

export type CouponEventInput = {
	type: CouponEventType;
	code: string;
	couponId?: string | null;
	clientId?: string | null;
	orderId?: string | null;
	reason?: string | null;
};

export interface CouponEventRecorderPort {
	record(event: CouponEventInput): Promise<void>;
}
