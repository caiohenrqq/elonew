import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { OrderPricingVersionNotFoundError } from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetOrderPricingVersionUseCase {
	constructor(
		@Inject(ORDER_PRICING_VERSION_REPOSITORY_KEY)
		private readonly pricingVersions: OrderPricingVersionRepositoryPort,
	) {}

	async execute(input: { versionId: string }) {
		const version = await this.pricingVersions.findById(input.versionId);
		if (!version) throw new OrderPricingVersionNotFoundError();

		return version;
	}
}
