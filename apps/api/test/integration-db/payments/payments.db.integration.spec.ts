import { PrismaService } from '@app/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { PaymentsModule } from '@modules/payments/payments.module';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import type { CreateOrderSchemaInput } from '@shared/orders/create-order.schema';

describe('Payments module integration (db)', () => {
	let moduleRef: TestingModule;
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;
	let prisma: PrismaService;
	let clientUser: AuthenticatedUser;

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
		moduleRef = await Test.createTestingModule({
			imports: [PaymentsModule],
		}).compile();

		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
		prisma = moduleRef.get(PrismaService);
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.order.deleteMany();
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
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates and fetches a payment with 70% booster share', async () => {
		const createdOrder = await createQuotedOrder();

		await expect(
			paymentsController.create(
				{
					paymentId: 'payment-db-1',
					orderId: createdOrder.id,
				},
				clientUser,
			),
		).resolves.toEqual({
			id: 'payment-db-1',
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 25.2,
			boosterAmount: 17.64,
		});

		await expect(
			paymentsController.get('payment-db-1', clientUser),
		).resolves.toEqual({
			id: 'payment-db-1',
			orderId: createdOrder.id,
			status: 'awaiting_confirmation',
			grossAmount: 25.2,
			boosterAmount: 17.64,
		});
	});

	it('keeps payment held until order completion', async () => {
		const createdOrder = await createQuotedOrder();
		await paymentsController.create(
			{
				paymentId: 'payment-db-2',
				orderId: createdOrder.id,
			},
			clientUser,
		);
		await paymentsController.confirm('payment-db-2');

		await expect(paymentsController.release('payment-db-2')).rejects.toThrow(
			'Payment hold can only be released after order completion.',
		);
	});

	it('treats repeated confirm endpoint calls as idempotent', async () => {
		const createdOrder = await createQuotedOrder();
		await paymentsController.create(
			{
				paymentId: 'payment-db-3',
				orderId: createdOrder.id,
			},
			clientUser,
		);

		await expect(paymentsController.confirm('payment-db-3')).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.confirm('payment-db-3')).resolves.toEqual({
			success: true,
		});
	});

	it('ignores duplicated webhook event ids', async () => {
		const createdOrder = await createQuotedOrder();
		await paymentsController.create(
			{
				paymentId: 'payment-db-4',
				orderId: createdOrder.id,
			},
			clientUser,
		);

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-db-1',
				paymentId: 'payment-db-4',
			}),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-db-1',
				paymentId: 'payment-db-4',
			}),
		).resolves.toEqual({ processed: false });

		await expect(
			paymentsController.get('payment-db-4', clientUser),
		).resolves.toMatchObject({
			id: 'payment-db-4',
			status: 'held',
		});
	});

	it('fails a payment, clears credentials, and keeps the negative state idempotent', async () => {
		const createdOrder = await createQuotedOrder();
		await paymentsController.create(
			{
				paymentId: 'payment-db-5',
				orderId: createdOrder.id,
			},
			clientUser,
		);
		await ordersController.confirmPayment(createdOrder.id);
		await ordersController.saveCredentials(createdOrder.id, {
			login: 'login-db',
			summonerName: 'summoner-db',
			password: 'secret-db',
			confirmPassword: 'secret-db',
		});

		await expect(paymentsController.fail('payment-db-5')).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.fail('payment-db-5')).resolves.toEqual({
			success: true,
		});

		await expect(
			paymentsController.get('payment-db-5', clientUser),
		).resolves.toMatchObject({
			id: 'payment-db-5',
			status: 'failed',
		});
		await expect(
			prisma.orderCredentials.findUnique({
				where: { orderId: createdOrder.id },
			}),
		).resolves.toBeNull();
	});
});
