import {
	type CouponEligibilityContext,
	evaluateCouponEligibility,
} from '@modules/orders/application/coupon-eligibility';
import { makeStoredCoupon } from '../../../../test/support/coupons/make-stored-coupon';

function makeContext(
	overrides: Partial<CouponEligibilityContext> = {},
): CouponEligibilityContext {
	return {
		clientEmail: 'player@example.com',
		isFirstPaidOrder: true,
		serviceType: 'elo_boost',
		desiredQueue: 'solo_duo',
		rankIndex: 14,
		selectedExtras: [],
		subtotal: 10000,
		...overrides,
	};
}

describe('evaluateCouponEligibility', () => {
	it('passes when no rules are configured', () => {
		expect(
			evaluateCouponEligibility(makeStoredCoupon(), makeContext()),
		).toEqual({ ok: true });
	});

	it('blocks service types outside the allow list', () => {
		const coupon = makeStoredCoupon({ allowedServiceTypes: ['coaching'] });
		expect(
			evaluateCouponEligibility(
				coupon,
				makeContext({ serviceType: 'elo_boost' }),
			),
		).toEqual({ ok: false, reason: 'service_type_not_allowed' });
	});

	it('matches targeted emails case-insensitively', () => {
		const coupon = makeStoredCoupon({ allowedEmails: ['player@example.com'] });
		expect(
			evaluateCouponEligibility(
				coupon,
				makeContext({ clientEmail: 'PLAYER@EXAMPLE.COM' }),
			),
		).toEqual({ ok: true });
	});

	it('enforces the subtotal range', () => {
		const coupon = makeStoredCoupon({ minSubtotal: 5000, maxSubtotal: 8000 });
		expect(
			evaluateCouponEligibility(coupon, makeContext({ subtotal: 9000 })),
		).toEqual({ ok: false, reason: 'subtotal_above_maximum' });
	});

	it('enforces the rank range', () => {
		const coupon = makeStoredCoupon({ minRankIndex: 16, maxRankIndex: 24 });
		expect(
			evaluateCouponEligibility(coupon, makeContext({ rankIndex: 10 })),
		).toEqual({ ok: false, reason: 'rank_below_minimum' });
	});

	it('requires a specific selected extra', () => {
		const coupon = makeStoredCoupon({ requiredExtra: 'priority_service' });
		expect(
			evaluateCouponEligibility(
				coupon,
				makeContext({ selectedExtras: ['extra_win'] }),
			),
		).toEqual({ ok: false, reason: 'required_extra_missing' });
		expect(
			evaluateCouponEligibility(
				coupon,
				makeContext({ selectedExtras: ['priority_service'] }),
			),
		).toEqual({ ok: true });
	});

	it('requires a minimum number of extras', () => {
		const coupon = makeStoredCoupon({ minExtrasCount: 2 });
		expect(
			evaluateCouponEligibility(
				coupon,
				makeContext({ selectedExtras: ['extra_win'] }),
			),
		).toEqual({ ok: false, reason: 'not_enough_extras' });
	});

	it('blocks first-order coupons for returning buyers', () => {
		const coupon = makeStoredCoupon({ firstOrderOnly: true });
		expect(
			evaluateCouponEligibility(
				coupon,
				makeContext({ isFirstPaidOrder: false }),
			),
		).toEqual({ ok: false, reason: 'not_first_order' });
	});
});
