import { OrderPricingVersionNotActiveError } from '@modules/orders/domain/order-pricing.errors';
import { VersionedOrderPricingService } from '@modules/orders/infrastructure/pricing/versioned-order-pricing.service';
import { makeDefaultOrderPricingVersionInput } from '../../../../../test/order-pricing-version-test-data';
import { InMemoryOrderPricingVersionRepository } from '../../../../../test/support/in-memory/orders/in-memory-order-pricing-version.repository';

describe('VersionedOrderPricingService', () => {
	it('rejects quote calculation when there is no active pricing version', async () => {
		const service = new VersionedOrderPricingService(
			new InMemoryOrderPricingVersionRepository(),
		);

		await expect(
			service.calculate({
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
		).rejects.toBeInstanceOf(OrderPricingVersionNotActiveError);
	});

	it('calculates pricing from the active pricing version', async () => {
		const pricingVersions = new InMemoryOrderPricingVersionRepository();
		const version = await pricingVersions.createDraft(
			makeDefaultOrderPricingVersionInput(),
		);
		await pricingVersions.activate({
			versionId: version.id,
			activatedAt: new Date('2026-03-18T10:00:00.000Z'),
		});
		const service = new VersionedOrderPricingService(pricingVersions);

		await expect(
			service.calculate({
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
				extras: ['priority_service'],
			}),
		).resolves.toMatchObject({
			pricingVersionId: version.id,
			subtotal: 2772,
			totalAmount: 2772,
			discountAmount: 0,
			extras: [{ type: 'priority_service', price: 252 }],
		});
	});

	it('prices master as the terminal target for legacy pricing versions without a master row', async () => {
		const pricingVersions = new InMemoryOrderPricingVersionRepository();
		const defaultPricing = makeDefaultOrderPricingVersionInput();
		const version = await pricingVersions.createDraft({
			...defaultPricing,
			steps: defaultPricing.steps.filter((step) => step.league !== 'master'),
		});
		await pricingVersions.activate({
			versionId: version.id,
			activatedAt: new Date('2026-03-18T10:00:00.000Z'),
		});
		const service = new VersionedOrderPricingService(pricingVersions);

		await expect(
			service.calculate({
				serviceType: 'elo_boost',
				currentLeague: 'diamond',
				currentDivision: 'IV',
				currentLp: 0,
				desiredLeague: 'master',
				desiredDivision: 'MASTER',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
			}),
		).resolves.toMatchObject({
			pricingVersionId: version.id,
			subtotal: 30730,
			totalAmount: 30730,
			discountAmount: 0,
			extras: [],
		});
	});

	it('calculates master PDL deltas when the active version prices master progression', async () => {
		const pricingVersions = new InMemoryOrderPricingVersionRepository();
		const defaultPricing = makeDefaultOrderPricingVersionInput();
		const version = await pricingVersions.createDraft({
			...defaultPricing,
			steps: defaultPricing.steps.map((step) =>
				step.serviceType === 'elo_boost' && step.league === 'master'
					? { ...step, priceToNext: 8000 }
					: step,
			),
		});
		await pricingVersions.activate({
			versionId: version.id,
			activatedAt: new Date('2026-03-18T10:00:00.000Z'),
		});
		const service = new VersionedOrderPricingService(pricingVersions);

		await expect(
			service.calculate({
				serviceType: 'elo_boost',
				currentLeague: 'master',
				currentDivision: '50',
				currentLp: 50,
				desiredLeague: 'master',
				desiredDivision: '150',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
			}),
		).resolves.toMatchObject({
			pricingVersionId: version.id,
			subtotal: 8000,
			totalAmount: 8000,
			discountAmount: 0,
			extras: [],
		});
	});
});
