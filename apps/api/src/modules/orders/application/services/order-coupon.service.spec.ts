import type { OrderPricingSnapshot } from '@modules/orders/application/order-pricing';
import type {
	CouponLookupPort,
	StoredCoupon,
} from '@modules/orders/application/ports/coupon-lookup.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { ApplyOrderCouponService } from '@modules/orders/application/services/order-coupon.service';
import { Order } from '@modules/orders/domain/order.entity';

class CouponLookupStub implements CouponLookupPort {
	public coupon: StoredCoupon | null = null;
	public lastCode: string | null = null;
	public lastId: string | null = null;

	async findByCode(code: string): Promise<StoredCoupon | null> {
		this.lastCode = code;
		return this.coupon;
	}

	async findById(id: string): Promise<StoredCoupon | null> {
		this.lastId = id;
		return this.coupon;
	}
}

class OrderRepositoryStub implements OrderRepositoryPort {
	public hasOrderForClient = false;
	public checkedClientId: string | null = null;

	async create(): Promise<Order> {
		throw new Error('not needed in this test');
	}

	async findById(): Promise<Order | null> {
		throw new Error('not needed in this test');
	}

	async findByIdForClient(): Promise<Order | null> {
		throw new Error('not needed in this test');
	}

	async save(): Promise<void> {
		throw new Error('not needed in this test');
	}

	async existsForClient(clientId: string): Promise<boolean> {
		this.checkedClientId = clientId;
		return this.hasOrderForClient;
	}
}

describe('ApplyOrderCouponService', () => {
	it('applies a percentage coupon to the base quote pricing', async () => {
		const couponLookup = new CouponLookupStub();
		couponLookup.coupon = {
			id: 'coupon-1',
			code: 'WELCOME10',
			discountType: 'percentage',
			discount: 10,
			isActive: true,
			firstOrderOnly: false,
		};
		const orderRepository = new OrderRepositoryStub();
		const service = new ApplyOrderCouponService(couponLookup, orderRepository);
		const basePricing: OrderPricingSnapshot = {
			pricingVersionId: 'pricing-version-1',
			subtotal: 100,
			totalAmount: 100,
			discountAmount: 0,
			extras: [],
		};

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'WELCOME10',
				pricing: basePricing,
			}),
		).resolves.toEqual({
			couponId: 'coupon-1',
			pricing: {
				pricingVersionId: 'pricing-version-1',
				subtotal: 100,
				totalAmount: 90,
				discountAmount: 10,
				extras: [],
			},
		});
		expect(couponLookup.lastCode).toBe('WELCOME10');
		expect(orderRepository.checkedClientId).toBeNull();
	});

	it('applies a fixed coupon and clamps the total amount at zero', async () => {
		const couponLookup = new CouponLookupStub();
		couponLookup.coupon = {
			id: 'coupon-2',
			code: 'FLAT200',
			discountType: 'fixed',
			discount: 200,
			isActive: true,
			firstOrderOnly: false,
		};
		const orderRepository = new OrderRepositoryStub();
		const service = new ApplyOrderCouponService(couponLookup, orderRepository);

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'FLAT200',
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 100,
					totalAmount: 100,
					discountAmount: 0,
					extras: [],
				},
			}),
		).resolves.toEqual({
			couponId: 'coupon-2',
			pricing: {
				pricingVersionId: 'pricing-version-1',
				subtotal: 100,
				totalAmount: 0,
				discountAmount: 100,
				extras: [],
			},
		});
	});

	it('rejects unknown coupon codes', async () => {
		const service = new ApplyOrderCouponService(
			new CouponLookupStub(),
			new OrderRepositoryStub(),
		);

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'MISSING',
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 100,
					totalAmount: 100,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon is invalid.');
	});

	it('rejects inactive coupons', async () => {
		const couponLookup = new CouponLookupStub();
		couponLookup.coupon = {
			id: 'coupon-3',
			code: 'OFFLINE',
			discountType: 'percentage',
			discount: 10,
			isActive: false,
			firstOrderOnly: false,
		};
		const service = new ApplyOrderCouponService(
			couponLookup,
			new OrderRepositoryStub(),
		);

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'OFFLINE',
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 100,
					totalAmount: 100,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon is invalid.');
	});

	it('rejects first-order-only coupons when the client already has an order', async () => {
		const couponLookup = new CouponLookupStub();
		couponLookup.coupon = {
			id: 'coupon-4',
			code: 'FIRSTONLY',
			discountType: 'percentage',
			discount: 10,
			isActive: true,
			firstOrderOnly: true,
		};
		const orderRepository = new OrderRepositoryStub();
		orderRepository.hasOrderForClient = true;
		const service = new ApplyOrderCouponService(couponLookup, orderRepository);

		await expect(
			service.apply({
				clientId: 'client-1',
				couponCode: 'FIRSTONLY',
				pricing: {
					pricingVersionId: 'pricing-version-1',
					subtotal: 100,
					totalAmount: 100,
					discountAmount: 0,
					extras: [],
				},
			}),
		).rejects.toThrow('Coupon is invalid.');
		expect(orderRepository.checkedClientId).toBe('client-1');
	});
});
