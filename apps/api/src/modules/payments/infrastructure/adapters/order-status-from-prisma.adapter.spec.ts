import { OrderStatusFromPrismaAdapter } from '@modules/payments/infrastructure/adapters/order-status-from-prisma.adapter';

describe('OrderStatusFromPrismaAdapter', () => {
	it('returns order status when order exists', async () => {
		const prisma = {
			order: {
				findUnique: jest.fn().mockResolvedValue({ status: 'completed' }),
			},
		};
		const adapter = new OrderStatusFromPrismaAdapter(prisma as never);

		await expect(adapter.findByOrderId('order-1')).resolves.toBe('completed');
	});

	it('returns null when order does not exist', async () => {
		const prisma = {
			order: {
				findUnique: jest.fn().mockResolvedValue(null),
			},
		};
		const adapter = new OrderStatusFromPrismaAdapter(prisma as never);

		await expect(adapter.findByOrderId('missing-order')).resolves.toBeNull();
	});

	it('throws when persisted order status is invalid', async () => {
		const prisma = {
			order: {
				findUnique: jest.fn().mockResolvedValue({ status: 'invalid_status' }),
			},
		};
		const adapter = new OrderStatusFromPrismaAdapter(prisma as never);

		await expect(adapter.findByOrderId('order-1')).rejects.toThrow(
			'Invalid order status persisted: invalid_status',
		);
	});
});
