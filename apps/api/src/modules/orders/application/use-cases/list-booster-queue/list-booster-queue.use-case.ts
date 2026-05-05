import {
	BOOSTER_ORDER_READER_KEY,
	type BoosterOrderDashboardSnapshot,
	type BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import { Inject, Injectable } from '@nestjs/common';

type ListBoosterQueueInput = {
	boosterId: string;
	limit?: number;
};

type ListBoosterQueueOutput = {
	availableOrders: BoosterOrderDashboardSnapshot[];
	summary: {
		availableOrders: number;
		estimatedAvailableEarnings: number;
	};
};

const BOOSTER_QUEUE_LIMIT_DEFAULT = 20;
const BOOSTER_QUEUE_LIMIT_MAX = 50;

@Injectable()
export class ListBoosterQueueUseCase {
	constructor(
		@Inject(BOOSTER_ORDER_READER_KEY)
		private readonly boosterOrderReader: BoosterOrderReaderPort,
	) {}

	async execute(input: ListBoosterQueueInput): Promise<ListBoosterQueueOutput> {
		const limit = Math.min(
			input.limit ?? BOOSTER_QUEUE_LIMIT_DEFAULT,
			BOOSTER_QUEUE_LIMIT_MAX,
		);
		const availableOrders =
			await this.boosterOrderReader.findAvailableForBooster(
				input.boosterId,
				limit,
			);

		return {
			availableOrders,
			summary: {
				availableOrders: availableOrders.length,
				estimatedAvailableEarnings: this.sumBoosterAmount(availableOrders),
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
