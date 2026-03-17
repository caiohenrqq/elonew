import { createHmac } from 'node:crypto';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders (e2e)', () => {
	let app: INestApplication;

	function getJwtSecret(): string {
		return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';
	}

	function makeOrderPayload() {
		return {
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: '2026-03-31T00:00:00.000Z',
		};
	}

	function signToken(payload: Record<string, unknown>): string {
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${body}`)
			.digest('base64url');

		return `${header}.${body}.${signature}`;
	}

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.compile();

		app = moduleRef.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates an authenticated order and returns it', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		let orderId = '';

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect(({ body }) => {
				orderId = body.id;
				expect(body).toEqual({
					id: expect.any(String),
					status: 'awaiting_payment',
				});
			});

		await request(app.getHttpServer())
			.get(`/orders/${orderId}`)
			.expect(200, { id: orderId, status: 'awaiting_payment' });
	});

	it('moves order through payment and acceptance flow', async () => {
		const token = signToken({ sub: 'client-2', role: 'CLIENT' });
		let orderId = '';

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect(({ body }) => {
				orderId = body.id;
			});

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/payment-confirmed`)
			.expect(200, { success: true });

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/accept`)
			.expect(200, { success: true });

		await request(app.getHttpServer())
			.get(`/orders/${orderId}`)
			.expect(200, { id: orderId, status: 'in_progress' });
	});

	it('rejects unauthenticated create-order requests', async () => {
		await request(app.getHttpServer())
			.post('/orders')
			.send(makeOrderPayload())
			.expect(401);
	});

	it('rejects malformed access tokens', async () => {
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const payload = Buffer.from('not-json').toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${payload}`)
			.digest('base64url');

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${header}.${payload}.${signature}`)
			.send(makeOrderPayload())
			.expect(401);
	});

	it('rejects authenticated users without the required role', async () => {
		const token = signToken({ sub: 'booster-1', role: 'BOOSTER' });

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(403, {
				message: 'Insufficient permissions.',
				error: 'Forbidden',
				statusCode: 403,
			});
	});

	it('rejects invalid service types with bad request', async () => {
		const token = signToken({ sub: 'client-3', role: 'CLIENT' });

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeOrderPayload(), serviceType: 'unsupported' })
			.expect(400);
	});

	it('rejects create-order payloads with non-string boosterId', async () => {
		const token = signToken({ sub: 'client-7', role: 'CLIENT' });

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeOrderPayload(), boosterId: 123 })
			.expect(400);
	});

	it('returns 404 for unknown order in mutations', async () => {
		await request(app.getHttpServer())
			.post('/orders/missing/cancel')
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			});
	});

	it('returns 400 for invalid transition', async () => {
		const token = signToken({ sub: 'client-4', role: 'CLIENT' });
		let orderId = '';

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect(({ body }) => {
				orderId = body.id;
			});

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/accept`)
			.expect(400, {
				message: 'Invalid order transition: awaiting_payment -> in_progress.',
				error: 'Bad Request',
				statusCode: 400,
			});
	});

	it('rejects accept payloads with non-string boosterId', async () => {
		const token = signToken({ sub: 'client-5', role: 'CLIENT' });
		let orderId = '';

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect(({ body }) => {
				orderId = body.id;
			});

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/payment-confirmed`)
			.expect(200, { success: true });

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/accept`)
			.send({ boosterId: 123 })
			.expect(400);
	});

	it('rejects credentials payloads missing login', async () => {
		const token = signToken({ sub: 'client-6', role: 'CLIENT' });
		let orderId = '';

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect(({ body }) => {
				orderId = body.id;
			});

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/payment-confirmed`)
			.expect(200, { success: true });

		await request(app.getHttpServer())
			.post(`/orders/${orderId}/credentials`)
			.send({
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			})
			.expect(400);
	});
});
