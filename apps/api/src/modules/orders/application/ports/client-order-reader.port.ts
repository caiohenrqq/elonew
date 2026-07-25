import type { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderPricedExtra } from '@packages/shared/orders/order-extra';
import type { OrderServiceType } from '@packages/shared/orders/service-type';

export const CLIENT_ORDER_READER_KEY = Symbol('CLIENT_ORDER_READER_KEY');

export type ClientOrderDashboardSnapshot = {
	id: string;
	clientId: string | null;
	status: OrderStatus;
	serviceType: OrderServiceType | null;
	currentLeague: string | null;
	currentDivision: string | null;
	currentLp: number | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
	server: string | null;
	desiredQueue: string | null;
	lpGain: number | null;
	deadline: Date | null;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
	createdAt: Date;
};

export type ClientOrderDetailsSnapshot = Omit<
	ClientOrderDashboardSnapshot,
	'clientId' | 'createdAt'
> & {
	hasCredentials: boolean;
	summonerName: string | null;
	extras: OrderPricedExtra[];
	booster: {
		username: string;
		avatarUrl: string | null;
		reputation: number;
	} | null;
};

export interface ClientOrderReaderPort {
	findDetailsForClient(
		orderId: string,
		clientId: string,
	): Promise<ClientOrderDetailsSnapshot | null>;
	findRecentForClient(
		clientId: string,
		limit: number,
	): Promise<ClientOrderDashboardSnapshot[]>;
	countActiveForClient(clientId: string): Promise<number>;
	countForClient(clientId: string): Promise<number>;
	sumTotalAmountForClient(clientId: string): Promise<number>;
}
