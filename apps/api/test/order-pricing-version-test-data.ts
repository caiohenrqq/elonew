import { duoBoostPriceTable } from '@packages/config/orders/duo-boost-price-table';
import { eloBoostPriceTable } from '@packages/config/orders/elo-boost-price-table';
import { orderExtraDefinitions } from '@shared/orders/order-extra';

export function makeDefaultOrderPricingVersionInput(name = 'Default pricing'): {
	name: string;
	steps: Array<{
		serviceType: 'elo_boost' | 'duo_boost';
		league: string;
		division: string;
		priceToNext: number;
	}>;
	extras: Array<{
		type: (typeof orderExtraDefinitions)[number]['type'];
		modifierRate: number;
	}>;
} {
	return {
		name,
		steps: [
			...eloBoostPriceTable.map((entry) => ({
				serviceType: 'elo_boost' as const,
				league: entry.league,
				division: entry.division,
				priceToNext: entry.priceToNext,
			})),
			...duoBoostPriceTable.map((entry) => ({
				serviceType: 'duo_boost' as const,
				league: entry.league,
				division: entry.division,
				priceToNext: entry.priceToNext,
			})),
		],
		extras: orderExtraDefinitions.map((extra) => ({
			type: extra.type,
			modifierRate: extra.modifierRate,
		})),
	};
}
