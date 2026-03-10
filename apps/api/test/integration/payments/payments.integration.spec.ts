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
import { PaymentsModule } from '@modules/payments/payments.module';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import type { CreateOrderSchemaInput } from '@shared/orders/create-order.schema';

describe('Payments module integration', () => {
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;
	const clientUser: AuthenticatedUser = {
		id: 'client-1',
		role: Role.CLIENT,
	};

	function makeCreateOrderBody(): CreateOrderSchemaInput {
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

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [PaymentsModule],
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

		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
	});

	it('creates and fetches a payment with 70% booster share', async () => {
		const createdOrder = await ordersController.create(
			makeCreateOrderBody(),
			clientUser,
		);

		await expect(
			paymentsController.create({
				paymentId: 'payment-1',
				orderId: createdOrder.id,
				grossAmount: 100,
			}),
		).resolves.toEqual({
			id: 'payment-1',
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});

		await expect(paymentsController.get('payment-1')).resolves.toEqual({
			id: 'payment-1',
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});
	});

	it('keeps payment held until order completion', async () => {
		const createdOrder = await ordersController.create(
			makeCreateOrderBody(),
			clientUser,
		);
		await paymentsController.create({
			paymentId: 'payment-2',
			orderId: createdOrder.id,
			grossAmount: 100,
		});
		await paymentsController.confirm('payment-2');
		await expect(ordersController.get(createdOrder.id)).resolves.toMatchObject({
			id: createdOrder.id,
			status: 'pending_booster',
		});

		await expect(paymentsController.release('payment-2')).rejects.toThrow(
			'Payment hold can only be released after order completion.',
		);
	});

	it('treats repeated confirm endpoint calls as idempotent', async () => {
		const createdOrder = await ordersController.create(
			makeCreateOrderBody(),
			clientUser,
		);
		await paymentsController.create({
			paymentId: 'payment-3',
			orderId: createdOrder.id,
			grossAmount: 100,
		});

		await expect(paymentsController.confirm('payment-3')).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.confirm('payment-3')).resolves.toEqual({
			success: true,
		});
	});

	it('ignores duplicated webhook event ids', async () => {
		const createdOrder = await ordersController.create(
			makeCreateOrderBody(),
			clientUser,
		);
		await paymentsController.create({
			paymentId: 'payment-4',
			orderId: createdOrder.id,
			grossAmount: 100,
		});

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-1',
				paymentId: 'payment-4',
			}),
		).resolves.toEqual({ processed: true });
		await expect(ordersController.get(createdOrder.id)).resolves.toMatchObject({
			id: createdOrder.id,
			status: 'pending_booster',
		});

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-1',
				paymentId: 'payment-4',
			}),
		).resolves.toEqual({ processed: false });

		await expect(paymentsController.get('payment-4')).resolves.toMatchObject({
			id: 'payment-4',
			status: 'held',
		});
	});

	it('fails a payment and keeps the negative state idempotent', async () => {
		await ordersController.create({ orderId: 'order-5' });
		await paymentsController.create({
			paymentId: 'payment-5',
			orderId: 'order-5',
			grossAmount: 100,
		});

		await expect(paymentsController.fail('payment-5')).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.fail('payment-5')).resolves.toEqual({
			success: true,
		});

		await expect(paymentsController.get('payment-5')).resolves.toMatchObject({
			id: 'payment-5',
			status: 'failed',
		});
	});
});
