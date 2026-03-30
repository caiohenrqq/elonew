import type {
	OrderPricingExtraRate,
	OrderPricingStep,
	OrderPricingVersionSnapshot,
} from '@modules/orders/application/order-pricing-version';

export const ORDER_PRICING_VERSION_REPOSITORY_KEY = Symbol(
	'ORDER_PRICING_VERSION_REPOSITORY_KEY',
);

export interface OrderPricingVersionRepositoryPort {
	findActive(): Promise<OrderPricingVersionSnapshot | null>;
	findById(id: string): Promise<OrderPricingVersionSnapshot | null>;
	list(): Promise<OrderPricingVersionSnapshot[]>;
	createDraft(input: {
		name: string;
		steps: OrderPricingStep[];
		extras: OrderPricingExtraRate[];
	}): Promise<OrderPricingVersionSnapshot>;
	replaceDraft(input: {
		versionId: string;
		name: string;
		steps: OrderPricingStep[];
		extras: OrderPricingExtraRate[];
	}): Promise<OrderPricingVersionSnapshot>;
	activate(input: {
		versionId: string;
		activatedAt: Date;
	}): Promise<OrderPricingVersionSnapshot>;
}
