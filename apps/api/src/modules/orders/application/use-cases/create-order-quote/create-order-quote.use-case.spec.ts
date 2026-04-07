import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';
import type { OrderQuoteRepositoryPort } from '@modules/orders/application/ports/order-quote-repository.port';
import type { OrderCouponService } from '@modules/orders/application/services/order-coupon.service';
import { CreateOrderQuoteUseCase } from '@modules/orders/application/use-cases/create-order-quote/create-order-quote.use-case';
import { VersionedOrderPricingService } from '@modules/orders/infrastructure/pricing/versioned-order-pricing.service';
import { makeDefaultOrderPricingVersionInput } from '../../../../../../test/order-pricing-version-test-data';
import { InMemoryOrderPricingVersionRepository } from '../../../../../../test/support/in-memory/orders/in-memory-order-pricing-version.repository';

class InMemoryOrderQuoteRepository implements OrderQuoteRepositoryPort {
	lastCreated: {
		clientId: string;
		couponId: string | null;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	} | null = null;

	async create(input: {
		clientId: string;
		couponId: string | null;
		requestDetails: OrderQuoteSnapshot['requestDetails'];
		pricing: OrderQuoteSnapshot['pricing'];
		expiresAt: Date;
	}): Promise<{ id: string }> {
		this.lastCreated = input;

		return { id: 'quote-1' };
	}

	async consumeByIdForClient(): Promise<OrderQuoteSnapshot> {
		throw new Error('not needed in this test');
	}

	async restoreConsumedByIdForClient(): Promise<void> {}
}

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

describe('CreateOrderQuoteUseCase', () => {
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

	it('persists an owned quote with a 60-minute expiration and returns its id', async () => {
		const quoteRepository = new InMemoryOrderQuoteRepository();
		const couponService = new OrderCouponServiceStub();
		const useCase = new CreateOrderQuoteUseCase(
			await makePricingService(),
			couponService,
			quoteRepository,
			{
				orderQuoteTtlMinutes: 60,
			} as never,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
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
			quoteId: 'quote-1',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});

		expect(quoteRepository.lastCreated).toMatchObject({
			clientId: 'client-1',
			couponId: null,
			pricing: {
				pricingVersionId: expect.any(String),
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
				extras: [],
			},
			expiresAt: new Date('2026-03-18T13:00:00.000Z'),
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

	it('applies coupon pricing before persisting the quote', async () => {
		const quoteRepository = new InMemoryOrderQuoteRepository();
		const couponService = new OrderCouponServiceStub();
		const useCase = new CreateOrderQuoteUseCase(
			await makePricingService(),
			couponService,
			quoteRepository,
			{
				orderQuoteTtlMinutes: 60,
			} as never,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
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
				couponCode: 'WELCOME10',
			}),
		).resolves.toEqual({
			quoteId: 'quote-1',
			subtotal: 25.2,
			totalAmount: 22.68,
			discountAmount: 2.52,
		});

		expect(couponService.lastInput).toMatchObject({
			clientId: 'client-1',
			couponCode: 'WELCOME10',
			pricing: {
				pricingVersionId: expect.any(String),
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
				extras: [],
			},
		});
		expect(quoteRepository.lastCreated).toMatchObject({
			couponId: 'coupon-1',
			pricing: {
				pricingVersionId: expect.any(String),
				subtotal: 25.2,
				totalAmount: 22.68,
				discountAmount: 2.52,
				extras: [],
			},
		});
	});

	it('applies deterministic extras pricing before coupon calculation', async () => {
		const quoteRepository = new InMemoryOrderQuoteRepository();
		const couponService = new OrderCouponServiceStub();
		const useCase = new CreateOrderQuoteUseCase(
			await makePricingService(),
			couponService,
			quoteRepository,
			{
				orderQuoteTtlMinutes: 60,
			} as never,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
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
			}),
		).resolves.toEqual({
			quoteId: 'quote-1',
			subtotal: 36.54,
			totalAmount: 36.54,
			discountAmount: 0,
		});

		expect(couponService.lastInput).toMatchObject({
			pricing: {
				pricingVersionId: expect.any(String),
				subtotal: 36.54,
				totalAmount: 36.54,
				discountAmount: 0,
				extras: [
					{ type: 'mmr_buffed', price: 8.82 },
					{ type: 'priority_service', price: 2.52 },
					{ type: 'offline_chat', price: 0 },
				],
			},
		});
		expect(quoteRepository.lastCreated).toMatchObject({
			requestDetails: {
				extras: ['mmr_buffed', 'priority_service', 'offline_chat'],
			},
			pricing: {
				pricingVersionId: expect.any(String),
				subtotal: 36.54,
				totalAmount: 36.54,
				discountAmount: 0,
				extras: [
					{ type: 'mmr_buffed', price: 8.82 },
					{ type: 'priority_service', price: 2.52 },
					{ type: 'offline_chat', price: 0 },
				],
			},
		});
	});
});
