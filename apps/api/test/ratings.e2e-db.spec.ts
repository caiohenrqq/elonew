import { PrismaService } from '@app/common/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { signTestAccessToken as signToken } from './support/auth-token';

describe('Ratings (e2e db)', () => {
	let app: ApiHttpApp;
	let prisma: PrismaService;
	let clientId: string;
	let boosterId: string;

	const createUser = async (role: 'CLIENT' | 'BOOSTER'): Promise<string> => {
		const suffix = `${role}-${Date.now()}-${Math.random()}`;
		const user = await prisma.user.create({
			data: {
				username: `rating-${suffix}`,
				email: `rating-${suffix}@example.com`,
				password: 'secret',
				role,
				isActive: true,
				emailConfirmedAt: new Date(),
				profile: { create: {} },
			},
		});
		return user.id;
	};

	const createCompletedOrder = async (): Promise<string> => {
		const order = await prisma.order.create({
			data: {
				clientId,
				boosterId,
				status: 'completed',
				completedAt: new Date(),
			},
		});
		return order.id;
	};

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = await createTestHttpApp(moduleRef);
		prisma = moduleRef.get(PrismaService);

		await prisma.rating.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.order.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.profile.deleteMany();
		await prisma.authSession.deleteMany();
		await prisma.user.deleteMany();

		clientId = await createUser('CLIENT');
		boosterId = await createUser('BOOSTER');
	});

	afterEach(async () => {
		await prisma.rating.deleteMany();
		await prisma.order.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.profile.deleteMany();
		await prisma.user.deleteMany();
		await app.close();
	});

	it('records both rating directions and updates the booster reputation', async () => {
		const orderId = await createCompletedOrder();
		const clientToken = signToken({ sub: clientId, role: 'CLIENT' });
		const boosterToken = signToken({ sub: boosterId, role: 'BOOSTER' });

		await requestHttp(app)
			.post('/ratings')
			.set('Authorization', `Bearer ${clientToken}`)
			.send({ orderId, score: 4 })
			.expect(201)
			.expect<{ fromUserId: string; toUserId: string; score: number }>(
				({ body }) => {
					expect(body.fromUserId).toBe(clientId);
					expect(body.toUserId).toBe(boosterId);
					expect(body.score).toBe(4);
				},
			)
			.execute();

		await requestHttp(app)
			.post('/ratings')
			.set('Authorization', `Bearer ${boosterToken}`)
			.send({ orderId, score: 5 })
			.expect(201)
			.expect<{ toUserId: string }>(({ body }) => {
				expect(body.toUserId).toBe(clientId);
			})
			.execute();

		await requestHttp(app)
			.get(`/ratings/orders/${orderId}`)
			.set('Authorization', `Bearer ${clientToken}`)
			.expect(200)
			.expect<Array<{ fromUserId: string }>>(({ body }) => {
				expect(body).toHaveLength(2);
			})
			.execute();

		const boosterProfile = await prisma.profile.findUnique({
			where: { userId: boosterId },
		});
		expect(boosterProfile?.reputation).toBe(4);
	});

	it('rejects a duplicate rating in the same direction with 409', async () => {
		const orderId = await createCompletedOrder();
		const clientToken = signToken({ sub: clientId, role: 'CLIENT' });

		await requestHttp(app)
			.post('/ratings')
			.set('Authorization', `Bearer ${clientToken}`)
			.send({ orderId, score: 5 })
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/ratings')
			.set('Authorization', `Bearer ${clientToken}`)
			.send({ orderId, score: 1 })
			.expect(409)
			.execute();
	});

	it('rejects a stranger with 403', async () => {
		const orderId = await createCompletedOrder();
		const strangerId = await createUser('CLIENT');
		const strangerToken = signToken({ sub: strangerId, role: 'CLIENT' });

		await requestHttp(app)
			.post('/ratings')
			.set('Authorization', `Bearer ${strangerToken}`)
			.send({ orderId, score: 5 })
			.expect(403)
			.execute();
	});
});
