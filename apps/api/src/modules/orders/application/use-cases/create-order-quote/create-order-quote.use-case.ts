import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { OrderQuoteRequestDetails } from '@modules/orders/application/order-pricing';
import {
	ORDER_QUOTE_REPOSITORY_KEY,
	type OrderQuoteRepositoryPort,
} from '@modules/orders/application/ports/order-quote-repository.port';
import {
	ORDER_PRICING_SERVICE_KEY,
	type OrderPricingService,
} from '@modules/orders/application/services/order-pricing.service';
import { Inject, Injectable } from '@nestjs/common';

type CreateOrderQuoteInput = OrderQuoteRequestDetails & {
	clientId: string;
	now: Date;
};

type CreateOrderQuoteOutput = {
	quoteId: string;
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
};

@Injectable()
export class CreateOrderQuoteUseCase {
	constructor(
		@Inject(ORDER_PRICING_SERVICE_KEY)
		private readonly orderPricingService: OrderPricingService,
		@Inject(ORDER_QUOTE_REPOSITORY_KEY)
		private readonly orderQuoteRepository: OrderQuoteRepositoryPort,
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
	) {}

	async execute(input: CreateOrderQuoteInput): Promise<CreateOrderQuoteOutput> {
		const requestDetails = {
			serviceType: input.serviceType,
			currentLeague: input.currentLeague,
			currentDivision: input.currentDivision,
			currentLp: input.currentLp,
			desiredLeague: input.desiredLeague,
			desiredDivision: input.desiredDivision,
			server: input.server,
			desiredQueue: input.desiredQueue,
			lpGain: input.lpGain,
			deadline: input.deadline,
		};
		const pricing = this.orderPricingService.calculate(requestDetails);
		const quote = await this.orderQuoteRepository.create({
			clientId: input.clientId,
			requestDetails,
			pricing,
			expiresAt: new Date(
				input.now.getTime() + this.appSettings.orderQuoteTtlMinutes * 60_000,
			),
		});

		return {
			quoteId: quote.id,
			subtotal: pricing.subtotal,
			totalAmount: pricing.totalAmount,
			discountAmount: pricing.discountAmount,
		};
	}
}
