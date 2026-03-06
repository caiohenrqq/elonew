import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';

describe('PrismaOrderRepository', () => {
	it('saves and rehydrates an order from persistence records', async () => {
		const findUnique = jest
			.fn()
			.mockResolvedValue({ id: 'order-1', status: 'pending_booster' });
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
			status: 'pending_booster',
		} as never);

		await expect(repository.findById('order-1')).resolves.toMatchObject({
			id: 'order-1',
			status: 'pending_booster',
		});
		expect(upsert).toHaveBeenCalledWith({
			where: { id: 'order-1' },
			create: { id: 'order-1', status: 'pending_booster' },
			update: { status: 'pending_booster' },
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
});
