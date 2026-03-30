import type {
	OrderPricingSnapshot,
	OrderQuoteRequestDetails,
} from '@modules/orders/application/order-pricing';

export const ORDER_PRICING_SERVICE_KEY = Symbol('ORDER_PRICING_SERVICE_KEY');

export interface OrderPricingService {
	calculate(input: OrderQuoteRequestDetails): Promise<OrderPricingSnapshot>;
}
