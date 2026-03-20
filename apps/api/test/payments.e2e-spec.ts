import { createHmac } from 'node:crypto';
import { MERCADO_PAGO_SDK_PORT_KEY } from '@integrations/mercadopago/mercadopago-sdk.port';
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
	const testInternalApiKey =
		process.env.INTERNAL_API_KEY ?? 'test-internal-api-key';
	const validWebhookSignature = 'valid-signature';
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
			.overrideProvider(MERCADO_PAGO_SDK_PORT_KEY)
			.useValue({
				createPayment: jest.fn(),
				verifyWebhookSignature: jest.fn(async ({ signature }) => {
					return signature === validWebhookSignature;
				}),
			})
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
		if (app) await app.close();
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

	it('rejects create-payment payloads missing paymentMethod', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-missing-method',
				orderId: createdOrder.id,
			})
			.expect(400)
			.execute();
	});

	it('rejects unsupported payment methods', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-invalid-method',
				orderId: createdOrder.id,
				paymentMethod: 'cash',
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
				paymentMethod: 'pix',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/payments/webhooks/payment-confirmed')
			.set('x-request-id', 'request-1')
			.set('x-signature', validWebhookSignature)
			.send({
				paymentId: 'payment-1',
			})
			.expect(400)
			.execute();
	});

	it('rejects internal payment confirmation without the internal api key', async () => {
		const token = signToken({ sub: 'client-1', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-internal-confirm',
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/payments/internal/payment-internal-confirm/confirm')
			.expect(401, {
				message: 'Internal API key required.',
				error: 'Unauthorized',
				statusCode: 401,
			})
			.execute();
	});

	it('accepts internal payment confirmation with the configured internal api key', async () => {
		const token = signToken({ sub: 'client-internal-ok', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-internal-confirm-ok',
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/payments/internal/payment-internal-confirm-ok/confirm')
			.set('x-internal-api-key', testInternalApiKey)
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.get('/payments/payment-internal-confirm-ok')
			.set('Authorization', `Bearer ${token}`)
			.expect(200, {
				id: 'payment-internal-confirm-ok',
				orderId: createdOrder.id,
				status: 'held',
				grossAmount: 25.2,
				boosterAmount: 17.64,
				paymentMethod: 'pix',
			})
			.execute();
	});

	it('rejects payment-confirmed webhooks without a valid signature', async () => {
		const token = signToken({ sub: 'client-webhook', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);

		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-webhook-signature',
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post(
				'/payments/webhooks/payment-confirmed?data.id=payment-webhook-signature',
			)
			.set('x-request-id', 'request-invalid-signature')
			.set('x-signature', 'ts=1710000000,v1=invalid')
			.send({
				eventId: 'event-invalid-signature',
				paymentId: 'payment-webhook-signature',
			})
			.expect(401, {
				message: 'Invalid payment webhook signature.',
				error: 'Unauthorized',
				statusCode: 401,
			})
			.execute();
	});

	it('accepts webhook confirmations only with a valid Mercado Pago signature', async () => {
		const token = signToken({ sub: 'client-webhook-ok', role: 'CLIENT' });
		const createdOrder = await createQuotedOrder(token);
		await requestHttp(app)
			.post('/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				paymentId: 'payment-webhook-valid',
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post(
				'/payments/webhooks/payment-confirmed?data.id=payment-webhook-valid',
			)
			.set('x-request-id', 'request-valid-signature')
			.set('x-signature', validWebhookSignature)
			.send({
				eventId: 'event-valid-signature',
				paymentId: 'payment-webhook-valid',
			})
			.expect(200, { processed: true })
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
				paymentMethod: 'pix',
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
				paymentMethod: 'pix',
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
				paymentMethod: 'pix',
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

	it('returns 401 when releasing a payment hold without internal authentication', async () => {
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
				paymentMethod: 'pix',
			},
			clientUser,
		);
		await paymentsController.confirm('payment-1');

		await requestHttp(app)
			.post('/payments/internal/payment-1/release')
			.expect(401, {
				message: 'Internal API key required.',
				error: 'Unauthorized',
				statusCode: 401,
			})
			.execute();
	});
});
