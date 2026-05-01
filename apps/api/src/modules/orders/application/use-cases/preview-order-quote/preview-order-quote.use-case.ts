import type { OrderQuoteRequestDetails } from '@modules/orders/application/order-pricing';
import {
	ORDER_COUPON_SERVICE_KEY,
	type OrderCouponService,
} from '@modules/orders/application/services/order-coupon.service';
import {
	ORDER_PRICING_SERVICE_KEY,
	type OrderPricingService,
} from '@modules/orders/application/services/order-pricing.service';
import { Inject, Injectable } from '@nestjs/common';

type PreviewOrderQuoteInput = OrderQuoteRequestDetails & {
	clientId: string;
	couponCode?: string;
};

type PreviewOrderQuoteOutput = {
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
	extras: {
		type: string;
		price: number;
	}[];
};

@Injectable()
export class PreviewOrderQuoteUseCase {
	constructor(
		@Inject(ORDER_PRICING_SERVICE_KEY)
		private readonly orderPricingService: OrderPricingService,
		@Inject(ORDER_COUPON_SERVICE_KEY)
		private readonly orderCouponService: OrderCouponService,
	) {}

	async execute(
		input: PreviewOrderQuoteInput,
	): Promise<PreviewOrderQuoteOutput> {
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

		return {
			subtotal: couponAdjustedPricing.pricing.subtotal,
			totalAmount: couponAdjustedPricing.pricing.totalAmount,
			discountAmount: couponAdjustedPricing.pricing.discountAmount,
			extras: couponAdjustedPricing.pricing.extras,
		};
	}
}
