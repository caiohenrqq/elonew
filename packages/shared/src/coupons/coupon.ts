export const couponDiscountTypes = ['percentage', 'fixed'] as const;
export type CouponDiscountType = (typeof couponDiscountTypes)[number];

export const couponEventTypes = [
	'created',
	'disabled',
	'enabled',
	'validation_failed',
	'eligibility_failed',
	'usage_limit_failed',
	'applied_at_checkout',
	'confirmed_by_payment',
] as const;
export type CouponEventType = (typeof couponEventTypes)[number];

export const COUPON_CODE_MIN_LENGTH = 4;
export const COUPON_CODE_MAX_LENGTH = 24;
const COUPON_CODE_PATTERN = /^[A-Z0-9]+$/;

export const COUPON_MAX_PERCENTAGE_DISCOUNT = 99;
export const COUPON_MIN_FIXED_DISCOUNT = 0.5;
export const COUPON_MIN_ORDER_TOTAL_CENTS = 50;

export function normalizeCouponCode(code: string): string {
	return code.trim().toUpperCase();
}

export function isValidCouponCode(code: string): boolean {
	return (
		code.length >= COUPON_CODE_MIN_LENGTH &&
		code.length <= COUPON_CODE_MAX_LENGTH &&
		COUPON_CODE_PATTERN.test(code)
	);
}

const GENERATED_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const GENERATED_CODE_LENGTH = 10;

export function generateCouponCode(
	randomInt: (maxExclusive: number) => number = (max) =>
		Math.floor(Math.random() * max),
): string {
	let code = '';
	for (let i = 0; i < GENERATED_CODE_LENGTH; i += 1) {
		code += GENERATED_CODE_ALPHABET[randomInt(GENERATED_CODE_ALPHABET.length)];
	}
	return code;
}
