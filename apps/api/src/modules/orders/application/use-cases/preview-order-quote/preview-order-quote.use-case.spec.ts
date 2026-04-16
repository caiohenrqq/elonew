import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';
import type { OrderCouponService } from '@modules/orders/application/services/order-coupon.service';
import { PreviewOrderQuoteUseCase } from '@modules/orders/application/use-cases/preview-order-quote/preview-order-quote.use-case';
import { VersionedOrderPricingService } from '@modules/orders/infrastructure/pricing/versioned-order-pricing.service';
import { makeDefaultOrderPricingVersionInput } from '../../../../../../test/order-pricing-version-test-data';
import { InMemoryOrderPricingVersionRepository } from '../../../../../../test/support/in-memory/orders/in-memory-order-pricing-version.repository';

class OrderCouponServiceStub implements OrderCouponService {
	lastInput: {
		clientId: string;
		couponCode?: string;
		pricing: OrderQuoteSnapshot['pricing'];
	} | null = null;

	async apply(input: {
		clientId: string;
		couponCode?: string;
		pricing: OrderQuoteSnapshot['pricing'];
	}) {
		this.lastInput = input;

		if (input.couponCode === 'WELCOME10') {
			return {
				couponId: 'coupon-1',
				pricing: {
					pricingVersionId: input.pricing.pricingVersionId,
					subtotal: input.pricing.subtotal,
					totalAmount: 22.68,
					discountAmount: 2.52,
					extras: input.pricing.extras,
				},
			};
		}

		return {
			couponId: null,
			pricing: input.pricing,
		};
	}
}

describe('PreviewOrderQuoteUseCase', () => {
	async function makePricingService() {
		const pricingVersions = new InMemoryOrderPricingVersionRepository();
		const version = await pricingVersions.createDraft(
			makeDefaultOrderPricingVersionInput(),
		);
		await pricingVersions.activate({
			versionId: version.id,
			activatedAt: new Date('2026-03-18T10:00:00.000Z'),
		});

		return new VersionedOrderPricingService(pricingVersions);
	}

	it('calculates quote pricing without requiring quote persistence', async () => {
		const couponService = new OrderCouponServiceStub();
		const useCase = new PreviewOrderQuoteUseCase(
			await makePricingService(),
			couponService,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
			}),
		).resolves.toEqual({
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
			extras: [],
		});
		expect(couponService.lastInput).toMatchObject({
			clientId: 'client-1',
			couponCode: undefined,
			pricing: {
				pricingVersionId: expect.any(String),
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
				extras: [],
			},
		});
	});

	it('returns coupon-adjusted pricing and priced extras', async () => {
		const couponService = new OrderCouponServiceStub();
		const useCase = new PreviewOrderQuoteUseCase(
			await makePricingService(),
			couponService,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
				extras: ['mmr_buffed', 'priority_service', 'offline_chat'],
				couponCode: 'WELCOME10',
			}),
		).resolves.toEqual({
			subtotal: 36.54,
			totalAmount: 22.68,
			discountAmount: 2.52,
			extras: [
				{ type: 'mmr_buffed', price: 8.82 },
				{ type: 'priority_service', price: 2.52 },
				{ type: 'offline_chat', price: 0 },
			],
		});
	});
});
