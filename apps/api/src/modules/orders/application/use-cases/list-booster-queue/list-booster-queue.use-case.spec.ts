import type {
	BoosterOrderDashboardSnapshot,
	BoosterOrderReaderPort,
} from '@modules/orders/application/ports/booster-order-reader.port';
import { ListBoosterQueueUseCase } from '@modules/orders/application/use-cases/list-booster-queue/list-booster-queue.use-case';
import { OrderStatus } from '@modules/orders/domain/order-status';

class BoosterOrderReaderStub implements BoosterOrderReaderPort {
	readonly calls: string[] = [];

	async findAvailableForBooster(
		_boosterId: string,
		limit: number,
	): Promise<BoosterOrderDashboardSnapshot[]> {
		this.calls.push('available');
		return [
			makeSnapshot({ id: 'queue-1', boosterAmount: 70 }),
			makeSnapshot({ id: 'queue-2', boosterAmount: 84 }),
		].slice(0, limit);
	}

	async findActiveForBooster(): Promise<BoosterOrderDashboardSnapshot[]> {
		this.calls.push('active');
		return [];
	}

	async findRecentCompletedForBooster(): Promise<
		BoosterOrderDashboardSnapshot[]
	> {
		this.calls.push('completed');
		return [];
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

describe('ListBoosterQueueUseCase', () => {
	it('returns only available orders and queue summary', async () => {
		const reader = new BoosterOrderReaderStub();
		const useCase = new ListBoosterQueueUseCase(reader);

		await expect(
			useCase.execute({ boosterId: 'booster-1', limit: 20 }),
		).resolves.toEqual({
			availableOrders: [
				expect.objectContaining({ id: 'queue-1' }),
				expect.objectContaining({ id: 'queue-2' }),
			],
			summary: {
				availableOrders: 2,
				estimatedAvailableEarnings: 154,
			},
		});
		expect(reader.calls).toEqual(['available']);
	});

	it('caps the queue list at the maximum limit', async () => {
		const reader = new BoosterOrderReaderStub();
		const useCase = new ListBoosterQueueUseCase(reader);

		await useCase.execute({ boosterId: 'booster-1', limit: 500 });

		expect(reader.calls).toEqual(['available']);
	});
});
