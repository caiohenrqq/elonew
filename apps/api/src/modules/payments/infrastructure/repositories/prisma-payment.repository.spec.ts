import { Payment } from '@modules/payments/domain/payment.entity';
import { PrismaPaymentRepository } from '@modules/payments/infrastructure/repositories/prisma-payment.repository';

describe('PrismaPaymentRepository', () => {
	it('saves and rehydrates a payment', async () => {
		const findUnique = jest.fn().mockResolvedValue({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'held',
			grossAmount: 100,
			boosterAmount: 70,
		});
		const upsert = jest.fn().mockResolvedValue(undefined);
		const prisma = {
			payment: {
				findUnique,
				findFirst: jest.fn(),
				upsert,
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
		});
		payment.confirm();

		await repository.save(payment);

		await expect(repository.findById('payment-1')).resolves.toMatchObject({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'held',
			grossAmount: 100,
			boosterAmount: 70,
		});
		expect(upsert).toHaveBeenCalledWith({
			where: { id: 'payment-1' },
			create: {
				id: 'payment-1',
				orderId: 'order-1',
				status: 'held',
				grossAmount: 100,
				boosterAmount: 70,
			},
			update: {
				status: 'held',
				grossAmount: 100,
				boosterAmount: 70,
			},
		});
	});

	it('returns null when payment is missing', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue(null),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(repository.findById('missing-payment')).resolves.toBeNull();
	});

	it('throws when persisted payment status is invalid', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue({
					id: 'payment-1',
					orderId: 'order-1',
					status: 'invalid_status',
					grossAmount: 100,
					boosterAmount: 70,
				}),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(repository.findById('payment-1')).rejects.toThrow(
			'Invalid payment status persisted: invalid_status',
		);
	});

	it('rehydrates failed payment status', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue({
					id: 'payment-failed-1',
					orderId: 'order-failed-1',
					status: 'failed',
					grossAmount: 100,
					boosterAmount: 70,
				}),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(
			repository.findById('payment-failed-1'),
		).resolves.toMatchObject({
			id: 'payment-failed-1',
			status: 'failed',
		});
	});
});
