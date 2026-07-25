import {
	BOOSTER_ORDER_READER_KEY,
	type BoosterOrderDashboardSnapshot,
	type BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import { Inject, Injectable } from '@nestjs/common';

type ListBoosterQueueInput = {
	boosterId: string;
};

type ListBoosterQueueOutput = {
	availableOrders: BoosterOrderDashboardSnapshot[];
	summary: {
		availableOrders: number;
		estimatedAvailableEarnings: number;
	};
};

@Injectable()
export class ListBoosterQueueUseCase {
	constructor(
		@Inject(BOOSTER_ORDER_READER_KEY)
		private readonly boosterOrderReader: BoosterOrderReaderPort,
	) {}

	async execute(input: ListBoosterQueueInput): Promise<ListBoosterQueueOutput> {
		const availableOrders =
			await this.boosterOrderReader.findAvailableForBooster(input.boosterId);

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
