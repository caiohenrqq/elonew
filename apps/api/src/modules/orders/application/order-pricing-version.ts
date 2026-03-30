import type { OrderExtraType } from '@shared/orders/order-extra';
import type { RankPricedOrderServiceType } from '@shared/orders/order-rank-progression';

export type OrderPricingVersionStatus = 'draft' | 'active' | 'archived';

export type OrderPricingStep = {
	serviceType: RankPricedOrderServiceType;
	league: string;
	division: string;
	priceToNext: number;
};

export type OrderPricingExtraRate = {
	type: OrderExtraType;
	modifierRate: number;
};

export type OrderPricingVersionSnapshot = {
	id: string;
	name: string;
	status: OrderPricingVersionStatus;
	createdAt: Date;
	updatedAt: Date;
	activatedAt: Date | null;
	steps: OrderPricingStep[];
	extras: OrderPricingExtraRate[];
};
