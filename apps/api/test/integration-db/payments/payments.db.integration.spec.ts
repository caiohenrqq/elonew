import { PrismaService } from '@app/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { PaymentsModule } from '@modules/payments/payments.module';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { MERCADO_PAGO_SDK_PORT_KEY } from '@packages/integrations/mercadopago/mercadopago-sdk.port';
import type { CreateOrderSchemaInput } from '@shared/orders/create-order.schema';
import { makeDefaultOrderPricingVersionInput } from '../../order-pricing-version-test-data';

describe('Payments module integration (db)', () => {
	let moduleRef: TestingModule;
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;
	let prisma: PrismaService;
	let clientUser: AuthenticatedUser;
	let markOrderAsPaidUseCase: MarkOrderAsPaidUseCase;
	let mercadoPagoSdkMock: {
		createPayment: jest.Mock;
		fetchPaymentNotification: jest.Mock;
		verifyWebhookSignature: jest.Mock;
	};

	function makeCreateOrderBody(): CreateOrderSchemaInput {
		return {
			quoteId: 'replace-in-test',
		};
	}

	async function seedActivePricingVersion() {
		const input = makeDefaultOrderPricingVersionInput();

		await prisma.pricingVersion.create({
			data: {
				name: input.name,
				status: 'ACTIVE',
				activatedAt: new Date('2026-03-18T10:00:00.000Z'),
				steps: {
					create: input.steps.map((step) => ({
						serviceType:
							step.serviceType === 'elo_boost' ? 'ELO_BOOST' : 'DUO_BOOST',
						league: step.league,
						division: step.division,
						priceToNext: step.priceToNext,
					})),
				},
				extras: {
					create: input.extras.map((extra) => ({
						type: extra.type,
						modifierRate: extra.modifierRate,
					})),
				},
			},
		});
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

		moduleRef = await Test.createTestingModule({
			imports: [PaymentsModule],
		})
			.overrideProvider(MERCADO_PAGO_SDK_PORT_KEY)
			.useValue(mercadoPagoSdkMock)
			.compile();

		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
		markOrderAsPaidUseCase = moduleRef.get(MarkOrderAsPaidUseCase);
		prisma = moduleRef.get(PrismaService);
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.order.deleteMany();
		await prisma.coupon.deleteMany();
		await prisma.pricingVersion.deleteMany();
		const uniqueSuffix = Date.now().toString();
		const createdUser = await prisma.user.create({
			data: {
				username: `client-db-${uniqueSuffix}`,
				email: `client-db-${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'CLIENT',
			},
		});
		clientUser = {
			id: createdUser.id,
			role: Role.CLIENT,
		};
		await seedActivePricingVersion();
	});

	afterEach(async () => {
		await moduleRef.close();
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

	it('creates a payment from the discounted order total when a coupon is applied', async () => {
		await prisma.coupon.create({
			data: {
				code: 'WELCOME10',
				discountType: 'PERCENTAGE',
				discount: 10,
				isActive: true,
				firstOrderOnly: false,
			},
		});

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
				couponCode: 'WELCOME10',
			},
			clientUser,
		);

		const createdOrder = await ordersController.create(
			{
				quoteId: quote.quoteId,
			},
			clientUser,
		);

		await expect(
			paymentsController.create(
				{
					orderId: createdOrder.id,
					paymentMethod: 'boleto',
				},
				clientUser,
			),
		).resolves.toMatchObject({
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 22.68,
			boosterAmount: 15.88,
			paymentMethod: 'boleto',
		});
	});

	it('persists Mercado Pago gateway defaults for a newly created payment', async () => {
		const createdOrder = await createQuotedOrder();
		const createdPayment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'pix',
			},
			clientUser,
		);

		await expect(
			prisma.payment.findUnique({
				where: { id: createdPayment.id },
			}),
		).resolves.toMatchObject({
			id: createdPayment.id,
			gateway: 'MERCADO_PAGO',
			gatewayReferenceId: `pref-${createdPayment.id}`,
			gatewayId: null,
			gatewayStatus: 'pending',
			gatewayStatusDetail: null,
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

		await expect(
			prisma.payment.count({
				where: { orderId: createdOrder.id },
			}),
		).resolves.toBe(1);
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
					id: 'event-db-1',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-db-1',
				'request-db-1',
			),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.handleMercadoPagoWebhook(
				{
					id: 'event-db-1',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-db-1',
				'request-db-1',
			),
		).resolves.toEqual({ processed: false });

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({
			id: payment.id,
			status: 'held',
		});
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
					id: 'event-db-authorized',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-db-authorized',
				'request-db-authorized',
			),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({
			id: payment.id,
			status: 'awaiting_confirmation',
		});
		await expect(
			prisma.order.findUnique({
				where: { id: createdOrder.id },
				select: { status: true },
			}),
		).resolves.toMatchObject({
			status: 'awaiting_payment',
		});
	});

	it('fails the payment for rejected webhook statuses and clears credentials', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'credit_card',
			},
			clientUser,
		);
		await markOrderAsPaidUseCase.execute({ orderId: createdOrder.id });
		await ordersController.saveCredentials(
			createdOrder.id,
			{
				login: 'login-webhook',
				summonerName: 'summoner-webhook',
				password: 'secret-webhook',
				confirmPassword: 'secret-webhook',
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
					id: 'event-db-rejected',
					type: 'payment.updated',
					action: 'payment.updated',
					data: { id: payment.id },
				},
				'signature-db-rejected',
				'request-db-rejected',
			),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.get(payment.id, clientUser),
		).resolves.toMatchObject({
			id: payment.id,
			status: 'failed',
		});
		await expect(
			prisma.orderCredentials.findUnique({
				where: { orderId: createdOrder.id },
			}),
		).resolves.toBeNull();
	});

	it('fails a payment, clears credentials, and keeps the negative state idempotent', async () => {
		const createdOrder = await createQuotedOrder();
		const payment = await paymentsController.create(
			{
				orderId: createdOrder.id,
				paymentMethod: 'credit_card',
			},
			clientUser,
		);
		await markOrderAsPaidUseCase.execute({ orderId: createdOrder.id });
		await ordersController.saveCredentials(
			createdOrder.id,
			{
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
				confirmPassword: 'secret-db',
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
		).resolves.toMatchObject({
			id: payment.id,
			status: 'failed',
		});
		await expect(
			prisma.orderCredentials.findUnique({
				where: { orderId: createdOrder.id },
			}),
		).resolves.toBeNull();
	});
});
