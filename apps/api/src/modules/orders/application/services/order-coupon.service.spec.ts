import type { OrderQuoteRequestDetails } from '@modules/orders/application/order-pricing';
import type { CouponEventInput } from '@modules/orders/application/ports/coupon-event-recorder.port';
import type {
	CouponLookupPort,
	StoredCoupon,
} from '@modules/orders/application/ports/coupon-lookup.port';
import type { OrderClientReaderPort } from '@modules/orders/application/ports/order-client-reader.port';
import { ApplyOrderCouponService } from '@modules/orders/application/services/order-coupon.service';
import { makeStoredCoupon } from '../../../../../test/support/coupons/make-stored-coupon';

class CouponLookupStub implements CouponLookupPort {
	public coupon: StoredCoupon | null = null;
	public globalUsage = 0;
	public perUserUsage = 0;

	async findByCode(): Promise<StoredCoupon | null> {
		return this.coupon;
	}

	async findById(): Promise<StoredCoupon | null> {
		return this.coupon;
	}

	async countConfirmedUsage(): Promise<number> {
		return this.globalUsage;
	}

	async countConfirmedUsageForClient(): Promise<number> {
		return this.perUserUsage;
	}
}

class ClientReaderStub implements OrderClientReaderPort {
	public email: string | null = null;
	public paid = false;

	async findEmailById(): Promise<string | null> {
		return this.email;
	}

	async hasPaidOrder(): Promise<boolean> {
		return this.paid;
	}
}

class EventRecorderStub {
	public events: CouponEventInput[] = [];
	async record(event: CouponEventInput): Promise<void> {
		this.events.push(event);
	}
}

function makeRequestDetails(): OrderQuoteRequestDetails {
	return {
		serviceType: 'elo_boost',
		extras: [],
		currentLeague: 'gold',
		currentDivision: 'II',
		currentLp: 50,
		desiredLeague: 'platinum',
		desiredDivision: 'IV',
		server: 'br',
		desiredQueue: 'solo_duo',
		lpGain: 20,
		deadline: new Date('2026-03-31T00:00:00.000Z'),
	};
}

function makeService() {
	const couponLookup = new CouponLookupStub();
	const clientReader = new ClientReaderStub();
	const events = new EventRecorderStub();
	const service = new ApplyOrderCouponService(
		couponLookup,
		clientReader,
		events,
	);
	return { service, couponLookup, clientReader, events };
}

describe('ApplyOrderCouponService', () => {
	it('applies a percentage coupon to the quote subtotal', async () => {
		const { service, couponLookup } = makeService();
		couponLookup.coupon = makeStoredCoupon({
			code: 'WELCOME10',
			discountType: 'percentage',
			discount: 10,
		});

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'WELCOME10',
				requestDetails: makeRequestDetails(),
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 10000,
					totalAmount: 10000,
					discountAmount: 0,
					extras: [],
				},
			}),
		).resolves.toEqual({
			couponId: 'coupon-1',
			pricing: {
				pricingVersionId: 'pricing-version-1',
				subtotal: 10000,
				totalAmount: 9000,
				discountAmount: 1000,
				extras: [],
			},
		});
	});

	it('keeps the order total at the R$0.50 floor for an oversized fixed discount', async () => {
		const { service, couponLookup } = makeService();
		couponLookup.coupon = makeStoredCoupon({
			code: 'FLAT200',
			discountType: 'fixed',
			discount: 200,
		});

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'FLAT200',
				requestDetails: makeRequestDetails(),
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 10000,
					totalAmount: 10000,
					discountAmount: 0,
					extras: [],
				},
			}),
		).resolves.toEqual({
			couponId: 'coupon-1',
			pricing: {
				pricingVersionId: 'pricing-version-1',
				subtotal: 10000,
				totalAmount: 50,
				discountAmount: 9950,
				extras: [],
			},
		});
	});

	it('rejects unknown coupon codes', async () => {
		const { service } = makeService();

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'MISSING',
				requestDetails: makeRequestDetails(),
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 10000,
					totalAmount: 10000,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon was not found.');
	});

	it('rejects inactive coupons', async () => {
		const { service, couponLookup } = makeService();
		couponLookup.coupon = makeStoredCoupon({ isActive: false });

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'WELCOME10',
				requestDetails: makeRequestDetails(),
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 10000,
					totalAmount: 10000,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon is inactive.');
	});

	it('rejects first-order coupons when the client already has a paid order', async () => {
		const { service, couponLookup, clientReader } = makeService();
		couponLookup.coupon = makeStoredCoupon({ firstOrderOnly: true });
		clientReader.paid = true;

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'WELCOME10',
				requestDetails: makeRequestDetails(),
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 10000,
					totalAmount: 10000,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon is valid for the first order only.');
	});

	it('rejects coupons that reached the global usage limit', async () => {
		const { service, couponLookup } = makeService();
		couponLookup.coupon = makeStoredCoupon({ globalUsageLimit: 5 });
		couponLookup.globalUsage = 5;

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'WELCOME10',
				requestDetails: makeRequestDetails(),
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 10000,
					totalAmount: 10000,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon usage limit has been reached.');
	});

	it('records audit events only when emitEvents is set', async () => {
		const { service, couponLookup, events } = makeService();
		couponLookup.coupon = makeStoredCoupon();

		await service.apply({
			clientId: 'client-1',
			couponCode: 'WELCOME10',
			requestDetails: makeRequestDetails(),
			emitEvents: true,
			pricing: {
				pricingVersionId: 'pricing-version-1',
				subtotal: 10000,
				totalAmount: 10000,
				discountAmount: 0,
				extras: [],
			},
		});

		expect(events.events).toEqual([
			{
				type: 'applied_at_checkout',
				code: 'WELCOME10',
				couponId: 'coupon-1',
				clientId: 'client-1',
			},
		]);
	});
});
