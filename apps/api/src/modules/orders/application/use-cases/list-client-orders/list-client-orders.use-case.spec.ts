import type {
	ClientOrderDashboardSnapshot,
	ClientOrderReaderPort,
} from '@modules/orders/application/ports/client-order-reader.port';
import { ListClientOrdersUseCase } from '@modules/orders/application/use-cases/list-client-orders/list-client-orders.use-case';
import { OrderStatus } from '@modules/orders/domain/order-status';

class InMemoryClientOrderReader implements ClientOrderReaderPort {
	constructor(
		private readonly snapshots: ClientOrderDashboardSnapshot[],
		private readonly totalOrders: number,
		private readonly totalInvested: number,
	) {}

	async findRecentForClient(
		clientId: string,
		limit: number,
	): Promise<ClientOrderDashboardSnapshot[]> {
		return this.snapshots
			.filter((snapshot) => snapshot.clientId === clientId)
			.slice(0, limit);
	}

	async countActiveForClient(clientId: string): Promise<number> {
		return this.snapshots.filter(
			(snapshot) =>
				snapshot.clientId === clientId &&
				[
					OrderStatus.AWAITING_PAYMENT,
					OrderStatus.PENDING_BOOSTER,
					OrderStatus.IN_PROGRESS,
				].includes(snapshot.status),
		).length;
	}

	async countForClient(): Promise<number> {
		return this.totalOrders;
	}

	async sumTotalAmountForClient(): Promise<number> {
		return this.totalInvested;
	}
}

const makeSnapshot = (
	input: Partial<ClientOrderDashboardSnapshot> & {
		id: string;
		clientId: string;
		status: OrderStatus;
	},
): ClientOrderDashboardSnapshot => ({
	id: input.id,
	clientId: input.clientId,
	status: input.status,
	serviceType: input.serviceType ?? 'elo_boost',
	currentLeague: input.currentLeague ?? 'gold',
	currentDivision: input.currentDivision ?? 'II',
	currentLp: input.currentLp ?? 40,
	desiredLeague: input.desiredLeague ?? 'platinum',
	desiredDivision: input.desiredDivision ?? 'IV',
	server: input.server ?? 'br',
	desiredQueue: input.desiredQueue ?? 'solo_duo',
	lpGain: input.lpGain ?? 20,
	deadline: input.deadline ?? new Date('2026-05-01T00:00:00.000Z'),
	subtotal: input.subtotal ?? 100,
	totalAmount: input.totalAmount ?? 100,
	discountAmount: input.discountAmount ?? 0,
	createdAt: input.createdAt ?? new Date('2026-04-01T00:00:00.000Z'),
});

describe('ListClientOrdersUseCase', () => {
	it('returns recent client orders with dashboard summary', async () => {
		const reader = new InMemoryClientOrderReader(
			[
				makeSnapshot({
					id: 'order-1',
					clientId: 'client-1',
					status: OrderStatus.AWAITING_PAYMENT,
				}),
				makeSnapshot({
					id: 'order-2',
					clientId: 'client-1',
					status: OrderStatus.COMPLETED,
				}),
				makeSnapshot({
					id: 'order-3',
					clientId: 'client-2',
					status: OrderStatus.IN_PROGRESS,
				}),
			],
			2,
			175,
		);

		const useCase = new ListClientOrdersUseCase(reader);

		await expect(
			useCase.execute({ clientId: 'client-1', limit: 10 }),
		).resolves.toEqual({
			orders: [
				expect.objectContaining({ id: 'order-1' }),
				expect.objectContaining({ id: 'order-2' }),
			],
			summary: {
				activeOrders: 1,
				totalOrders: 2,
				totalInvested: 175,
			},
		});
	});

	it('caps the requested recent order limit', async () => {
		const reader = new InMemoryClientOrderReader(
			Array.from({ length: 60 }, (_, index) =>
				makeSnapshot({
					id: `order-${index + 1}`,
					clientId: 'client-1',
					status: OrderStatus.AWAITING_PAYMENT,
				}),
			),
			60,
			6000,
		);

		const useCase = new ListClientOrdersUseCase(reader);

		const result = await useCase.execute({ clientId: 'client-1', limit: 500 });

		expect(result.orders).toHaveLength(50);
	});
});
