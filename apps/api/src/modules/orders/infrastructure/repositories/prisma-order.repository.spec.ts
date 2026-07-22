import { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';

const cipher = () =>
	new OrderCredentialsCipherService({
		orderCredentialsEncryptionKey:
			'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
	} as never);

const withTransaction = <T extends object>(prisma: T) =>
	Object.assign(prisma, {
		$transaction: (callback: (tx: T) => Promise<unknown>) => callback(prisma),
	});

const requestDetails = {
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
} as const;

const orderRecord = (credentials: object | null) => ({
	id: 'order-1',
	clientId: 'client-1',
	boosterId: null,
	couponId: null,
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
	subtotal: null,
	totalAmount: null,
	discountAmount: 0,
	completedAt: null,
	extras: [],
	credentials,
});

describe('PrismaOrderRepository', () => {
	it('seals newly submitted credentials and never rehydrates plaintext', async () => {
		const orderCredentialsCipher = cipher();
		const sealedRecord = orderRecord({
			login: orderCredentialsCipher.encryptField('order-1', 'login', 'login'),
			summonerName: orderCredentialsCipher.encryptField(
				'order-1',
				'summonerName',
				'summoner',
			),
			password: orderCredentialsCipher.encryptField(
				'order-1',
				'password',
				'secret',
			),
		});
		const findUnique = jest.fn().mockResolvedValue(sealedRecord);
		const upsert = jest.fn().mockResolvedValue(sealedRecord);
		const deleteMany = jest.fn();
		const prisma = withTransaction({
			order: { findUnique, upsert },
			orderCredentials: { deleteMany },
		});

		const repository = new PrismaOrderRepository(
			prisma as never,
			orderCredentialsCipher,
		);
		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: OrderStatus.PENDING_BOOSTER,
			requestDetails,
		});
		order.setCredentials({
			login: 'login',
			summonerName: 'summoner',
			password: 'secret',
		});
		await repository.save(order);

		expect(deleteMany).not.toHaveBeenCalled();
		const sealedFields = {
			login: expect.stringMatching(/^v2:/),
			summonerName: expect.stringMatching(/^v2:/),
			password: expect.stringMatching(/^v2:/),
		};
		expect(upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'order-1' },
				create: expect.objectContaining({
					credentials: { create: sealedFields },
				}),
				update: expect.objectContaining({
					credentials: {
						upsert: { create: sealedFields, update: sealedFields },
					},
				}),
			}),
		);

		const written = upsert.mock.calls[0][0].create.credentials.create;
		expect(
			orderCredentialsCipher.decryptField(
				'order-1',
				'password',
				written.password,
			),
		).toBe('secret');

		const rehydrated = await repository.findById('order-1');
		expect(rehydrated?.hasCredentials).toBe(true);
		expect(rehydrated?.pendingCredentials).toBeNull();
	});

	it('leaves stored credentials untouched when saving an unmodified order', async () => {
		const upsert = jest.fn().mockResolvedValue(undefined);
		const deleteMany = jest.fn();
		const prisma = withTransaction({
			order: { findUnique: jest.fn(), upsert },
			orderCredentials: { deleteMany },
		});
		const repository = new PrismaOrderRepository(prisma as never, cipher());

		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: OrderStatus.PENDING_BOOSTER,
			requestDetails,
			hasStoredCredentials: true,
		});
		await repository.save(order);

		expect(deleteMany).not.toHaveBeenCalled();
		const args = upsert.mock.calls[0][0];
		expect(args.create.credentials).toBeUndefined();
		expect(args.update.credentials).toBeUndefined();
	});

	it('deletes stored credentials when the order no longer has them', async () => {
		const upsert = jest.fn().mockResolvedValue(undefined);
		const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
		const prisma = withTransaction({
			order: { findUnique: jest.fn(), upsert },
			orderCredentials: { deleteMany },
		});
		const repository = new PrismaOrderRepository(prisma as never, cipher());

		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: OrderStatus.PENDING_BOOSTER,
			requestDetails,
			hasStoredCredentials: true,
		});
		order.clearCredentials();
		await repository.save(order);

		expect(deleteMany).toHaveBeenCalledWith({
			where: { orderId: 'order-1' },
		});
	});

	it('replaces stored credentials when new ones are submitted for the same order', async () => {
		const upsert = jest.fn().mockResolvedValue(undefined);
		const deleteMany = jest.fn();
		const prisma = withTransaction({
			order: { findUnique: jest.fn(), upsert },
			orderCredentials: { deleteMany },
		});
		const repository = new PrismaOrderRepository(prisma as never, cipher());

		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: OrderStatus.PENDING_BOOSTER,
			requestDetails,
			hasStoredCredentials: true,
		});
		order.setCredentials({
			login: 'new-login',
			summonerName: 'new-summoner',
			password: 'new-secret',
		});
		await repository.save(order);

		expect(deleteMany).not.toHaveBeenCalled();
		const args = upsert.mock.calls[0][0];
		expect(args.update.credentials.upsert.update).toEqual({
			login: expect.stringMatching(/^v2:/),
			summonerName: expect.stringMatching(/^v2:/),
			password: expect.stringMatching(/^v2:/),
		});
	});

	it('leaves stored credentials untouched when saving a booster rejection', async () => {
		const upsert = jest.fn().mockResolvedValue(undefined);
		const deleteMany = jest.fn();
		const rejectionUpsert = jest.fn().mockResolvedValue(undefined);
		const prisma = withTransaction({
			order: { findUnique: jest.fn(), upsert },
			orderCredentials: { deleteMany },
			orderBoosterRejection: { upsert: rejectionUpsert },
		});
		const repository = new PrismaOrderRepository(prisma as never, cipher());

		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: OrderStatus.PENDING_BOOSTER,
			requestDetails,
			hasStoredCredentials: true,
		});
		await repository.saveBoosterRejection(order, 'booster-1');

		expect(rejectionUpsert).toHaveBeenCalled();
		expect(deleteMany).not.toHaveBeenCalled();
		const args = upsert.mock.calls[0][0];
		expect(args.create.credentials).toBeUndefined();
		expect(args.update.credentials).toBeUndefined();
	});

	it('rejects sealing credentials for an order without a persisted id', async () => {
		const upsert = jest.fn();
		const deleteMany = jest.fn();
		const prisma = withTransaction({
			order: { findUnique: jest.fn(), upsert },
			orderCredentials: { deleteMany },
		});
		const repository = new PrismaOrderRepository(prisma as never, cipher());

		const order = Order.rehydrate({
			id: '',
			clientId: 'client-1',
			status: OrderStatus.PENDING_BOOSTER,
			requestDetails,
		});
		order.setCredentials({
			login: 'login',
			summonerName: 'summoner',
			password: 'secret',
		});

		await expect(repository.save(order)).rejects.toThrow(
			'Cannot encrypt an order credential without an order id.',
		);
		expect(upsert).not.toHaveBeenCalled();
	});

	it('returns null when order is missing', async () => {
		const prisma = {
			order: {
				findUnique: jest.fn().mockResolvedValue(null),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaOrderRepository(prisma as never, cipher());

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
		const repository = new PrismaOrderRepository(prisma as never, cipher());

		await expect(repository.findById('order-1')).rejects.toThrow(
			'Invalid order status persisted: invalid_status',
		);
	});
});
