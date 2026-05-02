import type {
	BoosterOrderDashboardSnapshot,
	BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import { ListBoosterWorkUseCase } from '@modules/orders/application/use-cases/list-booster-work/list-booster-work.use-case';
import { OrderStatus } from '@modules/orders/domain/order-status';

class BoosterOrderReaderStub implements BoosterOrderReaderPort {
	readonly calls: string[] = [];

	async findAvailableForBooster(): Promise<BoosterOrderDashboardSnapshot[]> {
		this.calls.push('available');
		return [];
	}

	async findActiveForBooster(): Promise<BoosterOrderDashboardSnapshot[]> {
		this.calls.push('active');
		return [
			makeSnapshot({
				id: 'active-1',
				status: OrderStatus.IN_PROGRESS,
				boosterId: 'booster-1',
			}),
		];
	}

	async findRecentCompletedForBooster(): Promise<
		BoosterOrderDashboardSnapshot[]
	> {
		this.calls.push('completed');
		return [
			makeSnapshot({
				id: 'completed-1',
				status: OrderStatus.COMPLETED,
				boosterId: 'booster-1',
				boosterAmount: 84,
			}),
		];
	}
}

const makeSnapshot = (
	input: Partial<BoosterOrderDashboardSnapshot> & { id: string },
): BoosterOrderDashboardSnapshot => ({
	id: input.id,
	boosterId: input.boosterId ?? null,
	status: input.status ?? OrderStatus.PENDING_BOOSTER,
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
	totalAmount: input.totalAmount ?? 100,
	boosterAmount: input.boosterAmount ?? 70,
	createdAt: input.createdAt ?? new Date('2026-04-01T00:00:00.000Z'),
});

describe('ListBoosterWorkUseCase', () => {
	it('returns active and completed orders without reading the queue', async () => {
		const reader = new BoosterOrderReaderStub();
		const useCase = new ListBoosterWorkUseCase(reader);

		await expect(
			useCase.execute({ boosterId: 'booster-1', limit: 20 }),
		).resolves.toEqual({
			activeOrders: [expect.objectContaining({ id: 'active-1' })],
			recentCompletedOrders: [expect.objectContaining({ id: 'completed-1' })],
			summary: {
				activeOrders: 1,
				completedOrders: 1,
				earnedFromRecentCompletions: 84,
			},
		});
		expect(reader.calls.sort()).toEqual(['active', 'completed']);
	});
});
