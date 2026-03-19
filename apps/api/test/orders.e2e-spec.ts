import { createHmac } from 'node:crypto';
import type { StoredCoupon } from '@modules/orders/application/ports/coupon-lookup.port';
import { COUPON_LOOKUP_PORT_KEY } from '@modules/orders/application/ports/coupon-lookup.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { InMemoryOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-checkout.repository';
import { InMemoryOrderQuoteRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-quote.repository';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Orders (e2e)', () => {
	let app: ApiHttpApp;
	let couponLookup: CouponLookupStub;
	let orderRepository: InMemoryOrderRepository;

	class CouponLookupStub {
		public coupons = new Map<string, StoredCoupon>();

		async findByCode(code: string): Promise<StoredCoupon | null> {
			return (
				Array.from(this.coupons.values()).find(
					(coupon) => coupon.code === code,
				) ?? null
			);
		}

		async findById(id: string): Promise<StoredCoupon | null> {
			return this.coupons.get(id) ?? null;
		}
	}

	function getJwtSecret(): string {
		return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';
	}

	function makeQuotePayload() {
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

	async function createQuotedOrder(token: string): Promise<{ id: string }> {
		let quoteId = '';
		let orderId = '';

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send(makeQuotePayload())
			.expect(201)
			.expect<{ quoteId: string }>(({ body }) => {
				quoteId = body.quoteId;
			})
			.execute();

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId })
			.expect(201)
			.expect<{ id: string }>(({ body }) => {
				orderId = body.id;
			})
			.execute();

		return { id: orderId };
	}

	function signToken(payload: Record<string, unknown>): string {
		const now = Math.floor(Date.now() / 1000);
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const body = Buffer.from(
			JSON.stringify({
				issuedAt: now,
				expiresAt: now + 900,
				...payload,
			}),
		).toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${body}`)
			.digest('base64url');

		return `${header}.${body}.${signature}`;
	}

	beforeEach(async () => {
		couponLookup = new CouponLookupStub();
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.overrideProvider(ORDER_CHECKOUT_PORT_KEY)
			.useClass(InMemoryOrderCheckoutRepository)
			.overrideProvider(ORDER_QUOTE_REPOSITORY_KEY)
			.useClass(InMemoryOrderQuoteRepository)
			.overrideProvider(COUPON_LOOKUP_PORT_KEY)
			.useValue(couponLookup)
			.compile();

		app = await createTestHttpApp(moduleRef);
		orderRepository = moduleRef.get(ORDER_REPOSITORY_KEY);
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates an authenticated order and returns it', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.get(`/orders/${createdOrder.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200, {
				id: createdOrder.id,
				status: 'awaiting_payment',
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
			})
			.execute();
	});

	it('rejects fetching another client order', async () => {
		const ownerToken = signToken({ sub: 'client-owner', role: 'CLIENT' });
		const otherToken = signToken({ sub: 'client-other', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(ownerToken);

		await requestHttp(app)
			.get(`/orders/${createdOrder.id}`)
			.set('Authorization', `Bearer ${otherToken}`)
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('rejects reusing a consumed quote', async () => {
		const token = signToken({ sub: 'client-reuse', role: 'CLIENT' });
		let quoteId = '';

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send(makeQuotePayload())
			.expect(201)
			.expect<{ quoteId: string }>(({ body }) => {
				quoteId = body.quoteId;
			})
			.execute();

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId })
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId })
			.expect(400, {
				message: 'Quote has already been used.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('moves order through payment and acceptance flow', async () => {
		const token = signToken({ sub: 'client-2', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/payment-confirmed`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/accept`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.get(`/orders/${createdOrder.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200, {
				id: createdOrder.id,
				status: 'in_progress',
				subtotal: 25.2,
				totalAmount: 25.2,
				discountAmount: 0,
			})
			.execute();
	});

	it('rejects unauthenticated create-order requests', async () => {
		await requestHttp(app)
			.post('/orders/quote')
			.send(makeQuotePayload())
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
			.post('/orders/quote')
			.set('Authorization', `Bearer ${header}.${payload}.${signature}`)
			.send(makeQuotePayload())
			.expect(401)
			.execute();
	});

	it('rejects authenticated users without the required role', async () => {
		const token = signToken({ sub: 'booster-1', role: 'BOOSTER' });

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send(makeQuotePayload())
			.expect(403, {
				message: 'Insufficient permissions.',
				error: 'Forbidden',
				statusCode: 403,
			})
			.execute();
	});

	it('rejects invalid service types with bad request', async () => {
		const token = signToken({ sub: 'client-3', role: 'CLIENT' });

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeQuotePayload(), serviceType: 'unsupported' })
			.expect(400)
			.execute();
	});

	it('returns the same invalid coupon response for missing and inactive coupons', async () => {
		const token = signToken({ sub: 'client-coupon', role: 'CLIENT' });
		couponLookup.coupons.set('INACTIVE10', {
			id: 'coupon-inactive',
			code: 'INACTIVE10',
			discountType: 'percentage',
			discount: 10,
			isActive: false,
			firstOrderOnly: false,
		});

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeQuotePayload(), couponCode: 'MISSING10' })
			.expect(400, {
				message: 'Coupon is invalid.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeQuotePayload(), couponCode: 'INACTIVE10' })
			.expect(400, {
				message: 'Coupon is invalid.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('returns the same invalid coupon response when a first-order coupon becomes ineligible', async () => {
		const token = signToken({ sub: 'client-first-order', role: 'CLIENT' });
		couponLookup.coupons.set('FIRST10', {
			id: 'coupon-first',
			code: 'FIRST10',
			discountType: 'percentage',
			discount: 10,
			isActive: true,
			firstOrderOnly: true,
		});

		const existingOrder = await createQuotedOrder(token);
		expect(await orderRepository.findById(existingOrder.id)).toBeTruthy();

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeQuotePayload(), couponCode: 'FIRST10' })
			.expect(400, {
				message: 'Coupon is invalid.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('rejects consuming a stale first-order coupon quote after another order is created', async () => {
		const token = signToken({ sub: 'client-stale-coupon', role: 'CLIENT' });
		let couponQuoteId = '';
		couponLookup.coupons.set('coupon-first', {
			id: 'coupon-first',
			code: 'FIRST10',
			discountType: 'percentage',
			discount: 10,
			isActive: true,
			firstOrderOnly: true,
		});

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send({ ...makeQuotePayload(), couponCode: 'FIRST10' })
			.expect(201)
			.expect<{ quoteId: string }>(({ body }) => {
				couponQuoteId = body.quoteId;
			})
			.execute();

		await createQuotedOrder(token);

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId: couponQuoteId })
			.expect(400, {
				message: 'Coupon is invalid.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('rejects create-order payloads with non-string boosterId', async () => {
		const token = signToken({ sub: 'client-7', role: 'CLIENT' });
		let quoteId = '';

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send(makeQuotePayload())
			.expect(201)
			.expect<{ quoteId: string }>(({ body }) => {
				quoteId = body.quoteId;
			})
			.execute();

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId, boosterId: 123 })
			.expect(400)
			.execute();
	});

	it('returns 404 for unknown order in mutations', async () => {
		const token = signToken({ sub: 'client-8', role: 'CLIENT' });

		await requestHttp(app)
			.get('/orders/missing')
			.set('Authorization', `Bearer ${token}`)
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('returns 400 for invalid transition', async () => {
		const token = signToken({ sub: 'client-4', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/accept`)
			.expect(400, {
				message: 'Invalid order transition: awaiting_payment -> in_progress.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('rejects accept payloads with non-string boosterId', async () => {
		const token = signToken({ sub: 'client-5', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/payment-confirmed`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/accept`)
			.send({ boosterId: 123 })
			.expect(400)
			.execute();
	});

	it('rejects credentials payloads missing login', async () => {
		const token = signToken({ sub: 'client-6', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/payment-confirmed`)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post(`/orders/${createdOrder.id}/credentials`)
			.send({
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			})
			.expect(400)
			.execute();
	});
});
