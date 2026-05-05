import type { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderServiceType } from '@packages/shared/orders/service-type';

export const BOOSTER_ORDER_READER_KEY = Symbol('BOOSTER_ORDER_READER_KEY');

export type BoosterOrderDashboardSnapshot = {
	id: string;
	boosterId: string | null;
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
	totalAmount: number | null;
	boosterAmount: number;
	createdAt: Date;
};

export interface BoosterOrderReaderPort {
	findAvailableForBooster(
		boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]>;
	findActiveForBooster(
		boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]>;
	findRecentCompletedForBooster(
		boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]>;
}
