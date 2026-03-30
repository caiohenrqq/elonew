import { OrderPricingVersionNotActiveError } from '@modules/orders/domain/order-pricing.errors';
import { VersionedOrderPricingService } from '@modules/orders/infrastructure/pricing/versioned-order-pricing.service';
import { InMemoryOrderPricingVersionRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-pricing-version.repository';
import { makeDefaultOrderPricingVersionInput } from '../../../../../test/order-pricing-version-test-data';

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
			subtotal: 27.72,
			totalAmount: 27.72,
			discountAmount: 0,
			extras: [{ type: 'priority_service', price: 2.52 }],
		});
	});
});
