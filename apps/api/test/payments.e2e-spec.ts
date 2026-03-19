import { createHmac } from 'node:crypto';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { InMemoryOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-checkout.repository';
import { InMemoryOrderQuoteRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-quote.repository';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { ORDER_PAYMENT_AMOUNT_PORT_KEY } from '@modules/payments/application/ports/order-payment-amount.port';
import { ORDER_STATUS_PORT_KEY } from '@modules/payments/application/ports/order-status.port';
import { PAYMENT_REPOSITORY_KEY } from '@modules/payments/application/ports/payment-repository.port';
import { PROCESSED_WEBHOOK_EVENT_PORT_KEY } from '@modules/payments/application/ports/processed-webhook-event.port';
import { OrderPaymentAmountFromOrdersRepositoryAdapter } from '@modules/payments/infrastructure/adapters/order-payment-amount-from-orders-repository.adapter';
import { OrderStatusFromOrdersRepositoryAdapter } from '@modules/payments/infrastructure/adapters/order-status-from-orders-repository.adapter';
import { InMemoryPaymentRepository } from '@modules/payments/infrastructure/repositories/in-memory-payment.repository';
import { InMemoryProcessedWebhookEventRepository } from '@modules/payments/infrastructure/repositories/in-memory-processed-webhook-event.repository';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Payments (e2e)', () => {
	let app: ApiHttpApp;
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;
	const clientUser: AuthenticatedUser = {
		id: 'client-1',
		role: Role.CLIENT,
	};

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
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.overrideProvider(ORDER_CHECKOUT_PORT_KEY)
			.useClass(InMemoryOrderCheckoutRepository)
			.overrideProvider(ORDER_QUOTE_REPOSITORY_KEY)
			.useClass(InMemoryOrderQuoteRepository)
			.overrideProvider(PAYMENT_REPOSITORY_KEY)
			.useClass(InMemoryPaymentRepository)
			.overrideProvider(PROCESSED_WEBHOOK_EVENT_PORT_KEY)
			.useClass(InMemoryProcessedWebhookEventRepository)
			.overrideProvider(ORDER_STATUS_PORT_KEY)
			.useClass(OrderStatusFromOrdersRepositoryAdapter)
			.overrideProvider(ORDER_PAYMENT_AMOUNT_PORT_KEY)
			.useClass(OrderPaymentAmountFromOrdersRepositoryAdapter)
			.compile();

		app = await createTestHttpApp(moduleRef);
		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
	});

	afterEach(async () => {
		await app.close();
	});

	it('rejects create-payment payloads missing paymentId', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				orderId: createdOrder.id,
			})
			.expect(400)
			.execute();
	});

	it('rejects payment-confirmed webhook payloads missing eventId', async () => {
		const token = signToken({ sub: 'client-2', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-1',
				orderId: createdOrder.id,
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/payments/webhooks/payment-confirmed')
			.send({
				paymentId: 'payment-1',
			})
			.expect(400)
			.execute();
	});

	it('returns 404 when creating a payment for an unknown order', async () => {
		const token = signToken({ sub: 'client-3', role: 'CLIENT' });

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-missing-order',
				orderId: 'missing-order',
			})
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('rejects creating a payment for another client order', async () => {
		const ownerToken = signToken({ sub: 'client-owner', role: 'CLIENT' });
		const otherToken = signToken({ sub: 'client-other', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(ownerToken);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${otherToken}`)
			.send({
				paymentId: 'payment-cross-client',
				orderId: createdOrder.id,
			})
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('rejects fetching another client payment', async () => {
		const ownerToken = signToken({ sub: 'client-owner', role: 'CLIENT' });
		const otherToken = signToken({ sub: 'client-other', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(ownerToken);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({
				paymentId: 'payment-owned',
				orderId: createdOrder.id,
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.get('/payments/payment-owned')
			.set('Authorization', `Bearer ${otherToken}`)
			.expect(404, {
				message: 'Payment not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('returns 400 when releasing a payment hold before order completion', async () => {
		const quote = await ordersController.quote(
			{
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
			},
			clientUser,
		);
		const order = await ordersController.create(
			{
				quoteId: quote.quoteId,
			},
			clientUser,
		);
		await paymentsController.create(
			{
				paymentId: 'payment-1',
				orderId: order.id,
			},
			clientUser,
		);
		await paymentsController.confirm('payment-1');

		await requestHttp(app)
			.post('/payments/payment-1/release')
			.expect(400, {
				message: 'Payment hold can only be released after order completion.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});
});
