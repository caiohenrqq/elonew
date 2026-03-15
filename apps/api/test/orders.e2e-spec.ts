import { createHmac } from 'node:crypto';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Orders (e2e)', () => {
	let app: ApiHttpApp;

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

		app = await createTestHttpApp(moduleRef);
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates an authenticated order and returns it', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		let orderId = '';

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ id: string; status: string }>(({ body }) => {
				orderId = body.id;
				expect(body).toEqual({
					id: expect.any(String),
					status: 'awaiting_payment',
				});
			})
			.execute();

		await requestHttp(app)
			.get(`/orders/${orderId}`)
			.expect(200, { id: orderId, status: 'awaiting_payment' })
			.execute();
	});

	it('moves order through payment and acceptance flow', async () => {
		const token = signToken({ sub: 'client-2', role: 'CLIENT' });
		let orderId = '';

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ id: string }>(({ body }) => {
				orderId = body.id;
			})
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/payment-confirmed`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/accept`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.get(`/orders/${orderId}`)
			.expect(200, { id: orderId, status: 'in_progress' })
			.execute();
	});

	it('rejects unauthenticated create-order requests', async () => {
		await requestHttp(app)
			.post('/orders')
			.send(makeOrderPayload())
			.expect(401)
			.execute();
	});

	it('rejects malformed access tokens', async () => {
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const payload = Buffer.from('not-json').toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${payload}`)
			.digest('base64url');

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${header}.${payload}.${signature}`)
			.send(makeOrderPayload())
			.expect(401)
			.execute();
	});

	it('rejects invalid service types with bad request', async () => {
		const token = signToken({ sub: 'client-3', role: 'CLIENT' });

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeOrderPayload(), serviceType: 'unsupported' })
			.expect(400)
			.execute();
	});

	it('rejects create-order payloads with non-string boosterId', async () => {
		const token = signToken({ sub: 'client-7', role: 'CLIENT' });

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeOrderPayload(), boosterId: 123 })
			.expect(400)
			.execute();
	});

	it('returns 404 for unknown order in mutations', async () => {
		await requestHttp(app)
			.post('/orders/missing/cancel')
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('returns 400 for invalid transition', async () => {
		const token = signToken({ sub: 'client-4', role: 'CLIENT' });
		let orderId = '';

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ id: string }>(({ body }) => {
				orderId = body.id;
			})
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/accept`)
			.expect(400, {
				message: 'Invalid order transition: awaiting_payment -> in_progress.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('rejects accept payloads with non-string boosterId', async () => {
		const token = signToken({ sub: 'client-5', role: 'CLIENT' });
		let orderId = '';

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ id: string }>(({ body }) => {
				orderId = body.id;
			})
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/payment-confirmed`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/accept`)
			.send({ boosterId: 123 })
			.expect(400)
			.execute();
	});

	it('rejects credentials payloads missing login', async () => {
		const token = signToken({ sub: 'client-6', role: 'CLIENT' });
		let orderId = '';

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ id: string }>(({ body }) => {
				orderId = body.id;
			})
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/payment-confirmed`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post(`/orders/${orderId}/credentials`)
			.send({
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			})
			.expect(400)
			.execute();
	});
});
