import type { OrderServiceType } from '@shared/orders/service-type';

export type OrderQuoteRequestDetails = {
	serviceType: OrderServiceType;
	currentLeague: string;
	currentDivision: string;
	currentLp: number;
	desiredLeague: string;
	desiredDivision: string;
	server: string;
	desiredQueue: string;
	lpGain: number;
	deadline: Date;
};

export type OrderPricingSnapshot = {
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
};

export type OrderQuoteSnapshot = {
	requestDetails: OrderQuoteRequestDetails;
	pricing: OrderPricingSnapshot;
};
