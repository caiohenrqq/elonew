import {
	BOOSTER_ORDER_READER_KEY,
	type BoosterOrderDashboardSnapshot,
	type BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import { Inject, Injectable } from '@nestjs/common';

type ListBoosterWorkInput = {
	boosterId: string;
	limit?: number;
};

type ListBoosterWorkOutput = {
	activeOrders: BoosterOrderDashboardSnapshot[];
	recentCompletedOrders: BoosterOrderDashboardSnapshot[];
	summary: {
		activeOrders: number;
		completedOrders: number;
		earnedFromRecentCompletions: number;
	};
};

const BOOSTER_WORK_LIMIT_DEFAULT = 20;
const BOOSTER_WORK_LIMIT_MAX = 50;

@Injectable()
export class ListBoosterWorkUseCase {
	constructor(
		@Inject(BOOSTER_ORDER_READER_KEY)
		private readonly boosterOrderReader: BoosterOrderReaderPort,
	) {}

	async execute(input: ListBoosterWorkInput): Promise<ListBoosterWorkOutput> {
		const limit = Math.min(
			input.limit ?? BOOSTER_WORK_LIMIT_DEFAULT,
			BOOSTER_WORK_LIMIT_MAX,
		);
		const [activeOrders, recentCompletedOrders] = await Promise.all([
			this.boosterOrderReader.findActiveForBooster(input.boosterId, limit),
			this.boosterOrderReader.findRecentCompletedForBooster(
				input.boosterId,
				limit,
			),
		]);

		return {
			activeOrders,
			recentCompletedOrders,
			summary: {
				activeOrders: activeOrders.length,
				completedOrders: recentCompletedOrders.length,
				earnedFromRecentCompletions: this.sumBoosterAmount(
					recentCompletedOrders,
				),
			},
		};
	}

	private sumBoosterAmount(orders: BoosterOrderDashboardSnapshot[]): number {
		return Number(
			orders
				.reduce((total, order) => total + order.boosterAmount, 0)
				.toFixed(2),
		);
	}
}
