import type { OrderQuoteSnapshot } from '@modules/orders/application/order-pricing';
import type { OrderQuoteRepositoryPort } from '@modules/orders/application/ports/order-quote-repository.port';
import type { OrderCouponService } from '@modules/orders/application/services/order-coupon.service';
import { CreateOrderQuoteUseCase } from '@modules/orders/application/use-cases/create-order-quote/create-order-quote.use-case';
import { StaticOrderPricingService } from '@modules/orders/infrastructure/pricing/static-order-pricing.service';

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
					subtotal: input.pricing.subtotal,
					totalAmount: 22.68,
					discountAmount: 2.52,
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
	it('persists an owned quote with a 60-minute expiration and returns its id', async () => {
		const quoteRepository = new InMemoryOrderQuoteRepository();
		const couponService = new OrderCouponServiceStub();
		const useCase = new CreateOrderQuoteUseCase(
			new StaticOrderPricingService(),
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
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
			},
			expiresAt: new Date('2026-03-18T13:00:00.000Z'),
		});
		expect(couponService.lastInput).toMatchObject({
			clientId: 'client-1',
			couponCode: undefined,
			pricing: {
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
			},
		});
	});

	it('applies coupon pricing before persisting the quote', async () => {
		const quoteRepository = new InMemoryOrderQuoteRepository();
		const couponService = new OrderCouponServiceStub();
		const useCase = new CreateOrderQuoteUseCase(
			new StaticOrderPricingService(),
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
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
			},
		});
		expect(quoteRepository.lastCreated).toMatchObject({
			couponId: 'coupon-1',
			pricing: {
				subtotal: 25.2,
				totalAmount: 22.68,
				discountAmount: 2.52,
			},
		});
	});
});
