import {
	CLIENT_ORDER_READER_KEY,
	type ClientOrderDashboardSnapshot,
	type ClientOrderReaderPort,
} from '@modules/orders/application/ports/client-order-reader.port';
import { Inject, Injectable } from '@nestjs/common';

type ListClientOrdersInput = {
	clientId: string;
	limit?: number;
};

type ListClientOrdersOutput = {
	orders: ClientOrderDashboardSnapshot[];
	summary: {
		activeOrders: number;
		totalOrders: number;
		totalInvested: number;
	};
};

const RECENT_ORDER_LIMIT_DEFAULT = 10;
const RECENT_ORDER_LIMIT_MAX = 50;

@Injectable()
export class ListClientOrdersUseCase {
	constructor(
		@Inject(CLIENT_ORDER_READER_KEY)
		private readonly clientOrderReader: ClientOrderReaderPort,
	) {}

	async execute(input: ListClientOrdersInput): Promise<ListClientOrdersOutput> {
		const limit = Math.min(
			input.limit ?? RECENT_ORDER_LIMIT_DEFAULT,
			RECENT_ORDER_LIMIT_MAX,
		);
		const [orders, activeOrders, totalOrders, totalInvested] =
			await Promise.all([
				this.clientOrderReader.findRecentForClient(input.clientId, limit),
				this.clientOrderReader.countActiveForClient(input.clientId),
				this.clientOrderReader.countForClient(input.clientId),
				this.clientOrderReader.sumTotalAmountForClient(input.clientId),
			]);

		return {
			orders,
			summary: {
				activeOrders,
				totalOrders,
				totalInvested,
			},
		};
	}
}
