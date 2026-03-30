import {
	normalizeOrderPricingVersionName,
	normalizePricingExtra,
	normalizePricingStep,
} from '@modules/orders/application/order-pricing-version.rules';
import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UpdateOrderPricingVersionUseCase {
	constructor(
		@Inject(ORDER_PRICING_VERSION_REPOSITORY_KEY)
		private readonly pricingVersions: OrderPricingVersionRepositoryPort,
	) {}

	async execute(input: {
		versionId: string;
		name: string;
		steps: Array<{
			serviceType: 'elo_boost' | 'duo_boost';
			league: string;
			division: string;
			priceToNext: number;
		}>;
		extras: Array<{
			type:
				| 'mmr_nerfed'
				| 'mmr_buffed'
				| 'priority_service'
				| 'favorite_booster'
				| 'super_restriction'
				| 'extra_win'
				| 'restricted_schedule'
				| 'kd_reduction'
				| 'deadline_reduction'
				| 'solo_service'
				| 'offline_chat'
				| 'spell_position'
				| 'specific_lanes'
				| 'specific_champions'
				| 'online_stream';
			modifierRate: number;
		}>;
	}) {
		return await this.pricingVersions.replaceDraft({
			versionId: input.versionId,
			name: normalizeOrderPricingVersionName(input.name),
			steps: input.steps.map((step) => normalizePricingStep(step)),
			extras: input.extras.map((extra) => normalizePricingExtra(extra)),
		});
	}
}
