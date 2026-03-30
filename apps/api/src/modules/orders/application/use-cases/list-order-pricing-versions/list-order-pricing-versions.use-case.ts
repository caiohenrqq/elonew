import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ListOrderPricingVersionsUseCase {
	constructor(
		@Inject(ORDER_PRICING_VERSION_REPOSITORY_KEY)
		private readonly pricingVersions: OrderPricingVersionRepositoryPort,
	) {}

	async execute() {
		return await this.pricingVersions.list();
	}
}
