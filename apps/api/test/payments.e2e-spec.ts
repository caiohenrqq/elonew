import { createHmac } from 'node:crypto';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { ORDER_STATUS_PORT_KEY } from '@modules/payments/application/ports/order-status.port';
import { PAYMENT_REPOSITORY_KEY } from '@modules/payments/application/ports/payment-repository.port';
import { PROCESSED_WEBHOOK_EVENT_PORT_KEY } from '@modules/payments/application/ports/processed-webhook-event.port';
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
			.overrideProvider(PAYMENT_REPOSITORY_KEY)
			.useClass(InMemoryPaymentRepository)
			.overrideProvider(PROCESSED_WEBHOOK_EVENT_PORT_KEY)
			.useClass(InMemoryProcessedWebhookEventRepository)
			.overrideProvider(ORDER_STATUS_PORT_KEY)
			.useClass(OrderStatusFromOrdersRepositoryAdapter)
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
			.post('/payments')
			.send({
				orderId,
				grossAmount: 100,
			})
			.expect(400)
			.execute();
	});

	it('rejects payment-confirmed webhook payloads missing eventId', async () => {
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
			.post('/payments')
			.send({
				paymentId: 'payment-1',
				orderId,
				grossAmount: 100,
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
		await requestHttp(app)
			.post('/payments')
			.send({
				paymentId: 'payment-missing-order',
				orderId: 'missing-order',
				grossAmount: 100,
			})
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('returns 400 when releasing a payment hold before order completion', async () => {
		const order = await ordersController.create(
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
		await paymentsController.create({
			paymentId: 'payment-1',
			orderId: order.id,
			grossAmount: 100,
		});
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
