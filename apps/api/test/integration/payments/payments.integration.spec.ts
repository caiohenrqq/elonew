import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { ORDER_PAYMENT_AMOUNT_PORT_KEY } from '@modules/payments/application/ports/order-payment-amount.port';
import { ORDER_STATUS_PORT_KEY } from '@modules/payments/application/ports/order-status.port';
import { PAYMENT_REPOSITORY_KEY } from '@modules/payments/application/ports/payment-repository.port';
import { PROCESSED_WEBHOOK_EVENT_PORT_KEY } from '@modules/payments/application/ports/processed-webhook-event.port';
import { PaymentsModule } from '@modules/payments/payments.module';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { MERCADO_PAGO_SDK_PORT_KEY } from '@packages/integrations/mercadopago/mercadopago-sdk.port';
import type { CreateOrderSchemaInput } from '@packages/shared/orders/create-order.schema';
import { makeDefaultOrderPricingVersionInput } from '../../order-pricing-version-test-data';
import { InMemoryOrderRepository } from '../../support/in-memory/orders/in-memory-order.repository';
import { InMemoryOrderCheckoutRepository } from '../../support/in-memory/orders/in-memory-order-checkout.repository';
import { InMemoryOrderPricingVersionRepository } from '../../support/in-memory/orders/in-memory-order-pricing-version.repository';
import { InMemoryOrderQuoteRepository } from '../../support/in-memory/orders/in-memory-order-quote.repository';
import { InMemoryPaymentRepository } from '../../support/in-memory/payments/in-memory-payment.repository';
import { InMemoryProcessedWebhookEventRepository } from '../../support/in-memory/payments/in-memory-processed-webhook-event.repository';
import { OrderPaymentAmountFromOrdersRepositoryAdapter } from '../../support/in-memory/payments/order-payment-amount-from-orders-repository.adapter';
import { OrderStatusFromOrdersRepositoryAdapter } from '../../support/in-memory/payments/order-status-from-orders-repository.adapter';

describe('Payments module integration', () => {
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;
	let pricingVersions: OrderPricingVersionRepositoryPort;
	let mercadoPagoSdkMock: {
		createPayment: jest.Mock;
		fetchPaymentNotification: jest.Mock;
		verifyWebhookSignature: jest.Mock;
	};
	const clientUser: AuthenticatedUser = {
		id: 'client-1',
		role: Role.CLIENT,
	};

	function makeCreateOrderBody(): CreateOrderSchemaInput {
		return {
			quoteId: 'replace-in-test',
		};
	}

	async function createQuotedOrder() {
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

		return await ordersController.create(
			{
				...makeCreateOrderBody(),
				quoteId: quote.quoteId,
			},
			clientUser,
		);
	}

	beforeEach(async () => {
		mercadoPagoSdkMock = {
			createPayment: jest.fn(async ({ paymentId }) => ({
				checkoutUrl: `https://mercadopago.test/checkout/${paymentId}`,
				gatewayReferenceId: `pref-${paymentId}`,
				gatewayStatus: 'pending',
			})),
			fetchPaymentNotification: jest.fn(async ({ notificationId }) => ({
				internalPaymentId: notificationId,
				gatewayPaymentId: `mp-${notificationId}`,
				gatewayStatus: 'approved',
				gatewayStatusDetail: 'accredited',
			})),
			verifyWebhookSignature: jest.fn().mockResolvedValue(true),
		};

		const moduleRef = await Test.createTestingModule({
			imports: [PaymentsModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.overrideProvider(ORDER_CHECKOUT_PORT_KEY)
			.useClass(InMemoryOrderCheckoutRepository)
			.overrideProvider(ORDER_QUOTE_REPOSITORY_KEY)
			.useClass(InMemoryOrderQuoteRepository)
			.overrideProvider(ORDER_PRICING_VERSION_REPOSITORY_KEY)
			.useClass(InMemoryOrderPricingVersionRepository)
			.overrideProvider(PAYMENT_REPOSITORY_KEY)
			.useClass(InMemoryPaymentRepository)
			.overrideProvider(PROCESSED_WEBHOOK_EVENT_PORT_KEY)
			.useClass(InMemoryProcessedWebhookEventRepository)
			.overrideProvider(MERCADO_PAGO_SDK_PORT_KEY)
			.useValue(mercadoPagoSdkMock)
			.overrideProvider(ORDER_STATUS_PORT_KEY)
			.useClass(OrderStatusFromOrdersRepositoryAdapter)
			.overrideProvider(ORDER_PAYMENT_AMOUNT_PORT_KEY)
			.useClass(OrderPaymentAmountFromOrdersRepositoryAdapter)
			.compile();

		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
		pricingVersions = moduleRef.get(ORDER_PRICING_VERSION_REPOSITORY_KEY);
		const version = await pricingVersions.createDraft(
			makeDefaultOrderPricingVersionInput(),
		);
		await pricingVersions.activate({
			versionId: version.id,
			activatedAt: new Date('2026-03-18T10:00:00.000Z'),
		});
	});

	it('creates and fetches a payment with 70% booster share', async () => {
		const createdOrder = await createQuotedOrder();

		const createdPayment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);

		expect(createdPayment).toMatchObject({
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 25.2,
			boosterAmount: 17.64,
			paymentMethod: 'pix',
			checkoutUrl: expect.stringContaining('/checkout/'),
		});
		expect(createdPayment.id).toEqual(expect.any(String));

		await expect(
			paymentsController.get(createdPayment.id, clientUser),
		).resolves.toMatchObject({
			id: createdPayment.id,
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 25.2,
			boosterAmount: 17.64,
			paymentMethod: 'pix',
		});
	});

	it('rejects creating a second payment for the same order', async () => {
		const createdOrder = await createQuotedOrder();

		await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);

		await expect(
			paymentsController.create(
				{
					orderId: createdOrder.id,
					paymentMethod: 'pix',
				},
				clientUser,
			),
		).rejects.toThrow('Payment already exists.');
	});

	it('keeps payment held until order completion', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);
		await paymentsController.confirm(payment.id);
		await expect(
			ordersController.get(createdOrder.id, clientUser),
		).resolves.toMatchObject({
			id: createdOrder.id,
			status: 'pending_booster',
		});

		await expect(paymentsController.release(payment.id)).rejects.toThrow(
			'Payment hold can only be released after order completion.',
		);
	});

	it('treats repeated confirm endpoint calls as idempotent', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);

		await expect(paymentsController.confirm(payment.id)).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.confirm(payment.id)).resolves.toEqual({
			success: true,
		});
	});

	it('ignores duplicated webhook event ids', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);

		await expect(
			paymentsController.handleMercadoPagoWebhook(
				{
					id: 'event-1',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-1',
				'request-1',
			),
		).resolves.toEqual({ processed: true });
		await expect(
			ordersController.get(createdOrder.id, clientUser),
		).resolves.toMatchObject({
			id: createdOrder.id,
			status: 'pending_booster',
		});

		await expect(
			paymentsController.handleMercadoPagoWebhook(
				{
					id: 'event-1',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-1',
				'request-1',
			),
		).resolves.toEqual({ processed: false });

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({ id: payment.id, status: 'held' });
	});

	it('keeps the payment awaiting confirmation for authorized webhook statuses', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);
		mercadoPagoSdkMock.fetchPaymentNotification.mockResolvedValueOnce({
			internalPaymentId: payment.id,
			gatewayPaymentId: `mp-${payment.id}`,
			gatewayStatus: 'authorized',
			gatewayStatusDetail: 'pending_capture',
		});

		await expect(
			paymentsController.handleMercadoPagoWebhook(
				{
					id: 'event-authorized',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-authorized',
				'request-authorized',
			),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({
			id: payment.id,
			status: 'awaiting_confirmation',
		});
		await expect(
			ordersController.get(createdOrder.id, clientUser),
		).resolves.toMatchObject({
			id: createdOrder.id,
			status: 'awaiting_payment',
		});
	});

	it('fails the payment for rejected webhook statuses', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);
		mercadoPagoSdkMock.fetchPaymentNotification.mockResolvedValueOnce({
			internalPaymentId: payment.id,
			gatewayPaymentId: `mp-${payment.id}`,
			gatewayStatus: 'rejected',
			gatewayStatusDetail: 'cc_rejected_bad_filled_security_code',
		});

		await expect(
			paymentsController.handleMercadoPagoWebhook(
				{
					id: 'event-rejected',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-rejected',
				'request-rejected',
			),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({ id: payment.id, status: 'failed' });
		await expect(
			ordersController.get(createdOrder.id, clientUser),
		).resolves.toMatchObject({
			id: createdOrder.id,
			status: 'awaiting_payment',
		});
	});

	it('fails a payment and keeps the negative state idempotent', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);

		await expect(paymentsController.fail(payment.id)).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.fail(payment.id)).resolves.toEqual({
			success: true,
		});

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({ id: payment.id, status: 'failed' });
	});
});
