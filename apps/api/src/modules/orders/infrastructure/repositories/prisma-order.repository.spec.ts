import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';

describe('PrismaOrderRepository', () => {
	it('saves and rehydrates an order from persistence records', async () => {
		const findUnique = jest.fn().mockResolvedValue({
			id: 'order-1',
			clientId: 'client-1',
			boosterId: null,
			status: 'pending_booster',
			serviceType: 'ELO_BOOST',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: new Date('2026-03-31T00:00:00.000Z'),
			credentials: {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
			},
		});
		const upsert = jest.fn().mockResolvedValue(undefined);
		const prisma = {
			order: {
				findUnique,
				upsert,
			},
		};

		const repository = new PrismaOrderRepository(prisma as never);
		await repository.save({
			id: 'order-1',
			clientId: 'client-1',
			status: 'pending_booster',
			requestDetails: {
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
			},
			credentials: {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
			},
		} as never);

		await expect(repository.findById('order-1')).resolves.toMatchObject({
			id: 'order-1',
			clientId: 'client-1',
			status: 'pending_booster',
			requestDetails: {
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
			},
			credentials: {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
			},
		});
		expect(upsert).toHaveBeenCalledWith({
			where: { id: 'order-1' },
			create: {
				id: 'order-1',
				clientId: 'client-1',
				boosterId: undefined,
				status: 'pending_booster',
				serviceType: 'ELO_BOOST',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
				credentials: {
					create: {
						login: 'login',
						summonerName: 'summoner',
						password: 'secret',
					},
				},
			},
			update: {
				clientId: 'client-1',
				boosterId: undefined,
				status: 'pending_booster',
				serviceType: 'ELO_BOOST',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
				credentials: {
					upsert: {
						create: {
							login: 'login',
							summonerName: 'summoner',
							password: 'secret',
						},
						update: {
							login: 'login',
							summonerName: 'summoner',
							password: 'secret',
						},
					},
				},
			},
		});
	});

	it('returns null when order is missing', async () => {
		const prisma = {
			order: {
				findUnique: jest.fn().mockResolvedValue(null),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaOrderRepository(prisma as never);

		await expect(repository.findById('missing-order')).resolves.toBeNull();
	});

	it('throws when persisted order status is invalid', async () => {
		const prisma = {
			order: {
				findUnique: jest
					.fn()
					.mockResolvedValue({ id: 'order-1', status: 'invalid_status' }),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaOrderRepository(prisma as never);

		await expect(repository.findById('order-1')).rejects.toThrow(
			'Invalid order status persisted: invalid_status',
		);
	});
});
