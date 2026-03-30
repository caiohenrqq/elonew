import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { OrderQuoteRequestDetails } from '@modules/orders/application/order-pricing';
import {
	ORDER_QUOTE_REPOSITORY_KEY,
	type OrderQuoteRepositoryPort,
} from '@modules/orders/application/ports/order-quote-repository.port';
import {
	ORDER_COUPON_SERVICE_KEY,
	type OrderCouponService,
} from '@modules/orders/application/services/order-coupon.service';
import {
	ORDER_PRICING_SERVICE_KEY,
	type OrderPricingService,
} from '@modules/orders/application/services/order-pricing.service';
import { Inject, Injectable } from '@nestjs/common';

type CreateOrderQuoteInput = OrderQuoteRequestDetails & {
	clientId: string;
	couponCode?: string;
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
		@Inject(ORDER_COUPON_SERVICE_KEY)
		private readonly orderCouponService: OrderCouponService,
		@Inject(ORDER_QUOTE_REPOSITORY_KEY)
		private readonly orderQuoteRepository: OrderQuoteRepositoryPort,
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
	) {}

	async execute(input: CreateOrderQuoteInput): Promise<CreateOrderQuoteOutput> {
		const requestDetails = {
			serviceType: input.serviceType,
			extras: input.extras ?? [],
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
		const pricing = await this.orderPricingService.calculate(requestDetails);
		const couponAdjustedPricing = await this.orderCouponService.apply({
			clientId: input.clientId,
			couponCode: input.couponCode,
			pricing,
		});
		const quote = await this.orderQuoteRepository.create({
			clientId: input.clientId,
			couponId: couponAdjustedPricing.couponId,
			requestDetails,
			pricing: couponAdjustedPricing.pricing,
			expiresAt: new Date(
				input.now.getTime() + this.appSettings.orderQuoteTtlMinutes * 60_000,
			),
		});

		return {
			quoteId: quote.id,
			subtotal: couponAdjustedPricing.pricing.subtotal,
			totalAmount: couponAdjustedPricing.pricing.totalAmount,
			discountAmount: couponAdjustedPricing.pricing.discountAmount,
		};
	}
}
