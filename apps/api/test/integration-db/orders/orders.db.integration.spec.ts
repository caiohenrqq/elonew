import { PrismaService } from '@app/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import {
	OrderBoosterNotEligibleError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import {
	OrderCouponInvalidError,
	OrderPricingVersionNotActiveError,
	OrderQuoteAlreadyUsedError,
} from '@modules/orders/domain/order-pricing.errors';
import { OrdersModule } from '@modules/orders/orders.module';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import type { CreateOrderSchemaInput } from '@packages/shared/orders/create-order.schema';
import { makeDefaultOrderPricingVersionInput } from '../../order-pricing-version-test-data';

describe('Orders module integration (db)', () => {
	let moduleRef: TestingModule;
	let controller: OrdersController;
	let prisma: PrismaService;
	let orderRepository: OrderRepositoryPort;
	let pricingVersions: OrderPricingVersionRepositoryPort;
	let markOrderAsPaidUseCase: MarkOrderAsPaidUseCase;
	let clientUser: AuthenticatedUser;
	let boosterUser: AuthenticatedUser;

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

	async function createQuotedOrder(input?: { boosterId?: string }) {
		const quote = await controller.quote(
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

		return await controller.create(
			{
				...makeCreateOrderBody(),
				quoteId: quote.quoteId,
				boosterId: input?.boosterId,
			},
			clientUser,
		);
	}

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [OrdersModule],
		}).compile();

		controller = moduleRef.get(OrdersController);
		prisma = moduleRef.get(PrismaService);
		orderRepository = moduleRef.get(ORDER_REPOSITORY_KEY);
		pricingVersions = moduleRef.get(ORDER_PRICING_VERSION_REPOSITORY_KEY);
		markOrderAsPaidUseCase = moduleRef.get(MarkOrderAsPaidUseCase);
		await prisma.payment.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.order.deleteMany();
		await prisma.coupon.deleteMany();
		await prisma.pricingVersion.deleteMany();
		const uniqueSuffix = Date.now().toString();
		const createdUser = await prisma.user.create({
			data: {
				username: `client-${uniqueSuffix}`,
				email: `client-${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'CLIENT',
			},
		});
		clientUser = {
			id: createdUser.id,
			role: Role.CLIENT,
		};
		const createdBooster = await prisma.user.create({
			data: {
				username: `booster-${uniqueSuffix}`,
				email: `booster-${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'BOOSTER',
			},
		});
		boosterUser = {
			id: createdBooster.id,
			role: Role.BOOSTER,
		};
		await seedActivePricingVersion();
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates and fetches an order', async () => {
		const createdOrder = await createQuotedOrder();

		expect(createdOrder).toMatchObject({
			id: expect.any(String),
			status: 'awaiting_payment',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		const persistedOrder = await prisma.order.findUnique({
			where: { id: createdOrder.id },
		});
		expect(persistedOrder).toMatchObject({
			id: createdOrder.id,
			clientId: clientUser.id,
			pricingVersionId: expect.any(String),
			serviceType: 'ELO_BOOST',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});

		await expect(controller.get(createdOrder.id, clientUser)).resolves.toEqual({
			id: createdOrder.id,
			status: 'awaiting_payment',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
	});

	it('persists a selected booster on create-order', async () => {
		const uniqueSuffix = `booster-${Date.now().toString()}`;
		const booster = await prisma.user.create({
			data: {
				username: uniqueSuffix,
				email: `${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'BOOSTER',
			},
		});

		const createdOrder = await createQuotedOrder({ boosterId: booster.id });

		const persistedOrder = await prisma.order.findUnique({
			where: { id: createdOrder.id },
		});
		expect(persistedOrder).toMatchObject({
			id: createdOrder.id,
			boosterId: booster.id,
		});
	});

	it('persists coupon pricing from quote to created order', async () => {
		const coupon = await prisma.coupon.create({
			data: {
				code: 'WELCOME10',
				discountType: 'PERCENTAGE',
				discount: 10,
				isActive: true,
				firstOrderOnly: false,
			},
		});

		const quote = await controller.quote(
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

		expect(quote).toMatchObject({
			subtotal: 25.2,
			totalAmount: 22.68,
			discountAmount: 2.52,
		});

		const persistedQuote = await prisma.orderQuote.findUnique({
			where: { id: quote.quoteId },
		});
		expect(persistedQuote).toMatchObject({
			id: quote.quoteId,
			couponId: coupon.id,
			pricingVersionId: expect.any(String),
			discountAmount: 2.52,
			totalAmount: 22.68,
		});

		const createdOrder = await controller.create(
			{
				quoteId: quote.quoteId,
			},
			clientUser,
		);

		const persistedOrder = await prisma.order.findUnique({
			where: { id: createdOrder.id },
		});
		expect(persistedOrder).toMatchObject({
			id: createdOrder.id,
			couponId: coupon.id,
			pricingVersionId: expect.any(String),
			discountAmount: 2.52,
			totalAmount: 22.68,
		});
	});

	it('fails quote creation cleanly when there is no active pricing version', async () => {
		await prisma.pricingVersion.deleteMany();

		await expect(
			controller.quote(
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
			),
		).rejects.toBeInstanceOf(OrderPricingVersionNotActiveError);
	});

	it('keeps persisted extras unchanged through later order lifecycle transitions', async () => {
		const quote = await controller.quote(
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
				extras: ['mmr_buffed', 'priority_service', 'offline_chat'],
			},
			clientUser,
		);

		const createdOrder = await controller.create(
			{
				quoteId: quote.quoteId,
			},
			clientUser,
		);

		await markOrderAsPaidUseCase.execute({ orderId: createdOrder.id });
		await controller.saveCredentials(
			createdOrder.id,
			{
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			},
			clientUser,
		);
		await controller.accept(createdOrder.id, boosterUser);
		await controller.complete(createdOrder.id, boosterUser);

		const persistedOrder = await prisma.order.findUnique({
			where: { id: createdOrder.id },
			include: { extras: true },
		});
		expect(persistedOrder).toMatchObject({
			id: createdOrder.id,
			status: 'completed',
			extras: [
				{ type: 'mmr_buffed', price: 8.82 },
				{ type: 'priority_service', price: 2.52 },
				{ type: 'offline_chat', price: 0 },
			],
		});
	});

	it('rejects consuming a second first-order coupon quote after the first order is created', async () => {
		await prisma.coupon.create({
			data: {
				code: 'FIRST10',
				discountType: 'PERCENTAGE',
				discount: 10,
				isActive: true,
				firstOrderOnly: true,
			},
		});

		const firstQuote = await controller.quote(
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
				couponCode: 'FIRST10',
			},
			clientUser,
		);
		const secondQuote = await controller.quote(
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
				couponCode: 'FIRST10',
			},
			clientUser,
		);

		await expect(
			controller.create({ quoteId: firstQuote.quoteId }, clientUser),
		).resolves.toMatchObject({
			status: 'awaiting_payment',
			totalAmount: 22.68,
			discountAmount: 2.52,
		});

		await expect(
			controller.create({ quoteId: secondQuote.quoteId }, clientUser),
		).rejects.toBeInstanceOf(OrderCouponInvalidError);

		await expect(
			prisma.order.count({
				where: {
					clientId: clientUser.id,
					discountAmount: 2.52,
				},
			}),
		).resolves.toBe(1);
	});

	it('creates only one discounted order when two first-order coupon quotes are consumed concurrently', async () => {
		await prisma.coupon.create({
			data: {
				code: 'FIRST10',
				discountType: 'PERCENTAGE',
				discount: 10,
				isActive: true,
				firstOrderOnly: true,
			},
		});

		const firstQuote = await controller.quote(
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
				couponCode: 'FIRST10',
			},
			clientUser,
		);
		const secondQuote = await controller.quote(
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
				couponCode: 'FIRST10',
			},
			clientUser,
		);

		const results = await Promise.allSettled([
			controller.create({ quoteId: firstQuote.quoteId }, clientUser),
			controller.create({ quoteId: secondQuote.quoteId }, clientUser),
		]);

		const successfulResults = results.filter(
			(
				result,
			): result is PromiseFulfilledResult<{
				id: string;
				status: string;
				subtotal: number | null;
				totalAmount: number | null;
				discountAmount: number;
			}> => result.status === 'fulfilled',
		);
		const failedResults = results.filter(
			(result): result is PromiseRejectedResult => result.status === 'rejected',
		);

		expect(successfulResults).toHaveLength(1);
		expect(failedResults).toHaveLength(1);
		expect(successfulResults[0]?.value).toMatchObject({
			status: 'awaiting_payment',
			totalAmount: 22.68,
			discountAmount: 2.52,
		});
		expect(failedResults[0]?.reason).toBeInstanceOf(OrderCouponInvalidError);

		await expect(
			prisma.order.count({
				where: {
					clientId: clientUser.id,
					discountAmount: 2.52,
				},
			}),
		).resolves.toBe(1);

		await expect(
			prisma.orderQuote.count({
				where: {
					id: {
						in: [firstQuote.quoteId, secondQuote.quoteId],
					},
					consumedAt: {
						not: null,
					},
				},
			}),
		).resolves.toBe(1);
	});

	it('creates exactly one order when the same quote is submitted concurrently', async () => {
		const quote = await controller.quote(
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

		const results = await Promise.allSettled([
			controller.create({ quoteId: quote.quoteId }, clientUser),
			controller.create({ quoteId: quote.quoteId }, clientUser),
		]);

		const successfulResults = results.filter(
			(
				result,
			): result is PromiseFulfilledResult<{
				id: string;
				status: string;
				subtotal: number | null;
				totalAmount: number | null;
				discountAmount: number;
			}> => result.status === 'fulfilled',
		);
		const failedResults = results.filter(
			(result): result is PromiseRejectedResult => result.status === 'rejected',
		);

		expect(successfulResults).toHaveLength(1);
		expect(failedResults).toHaveLength(1);
		expect(successfulResults[0]?.value).toMatchObject({
			id: expect.any(String),
			status: 'awaiting_payment',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		expect(failedResults[0]?.reason).toBeInstanceOf(OrderQuoteAlreadyUsedError);

		const persistedOrders = await prisma.order.findMany({
			where: { clientId: clientUser.id },
			orderBy: { createdAt: 'asc' },
		});
		expect(persistedOrders).toHaveLength(1);
		expect(persistedOrders[0]?.id).toBe(successfulResults[0]?.value.id);

		const persistedQuote = await prisma.orderQuote.findUnique({
			where: { id: quote.quoteId },
		});
		expect(persistedQuote).toMatchObject({
			id: quote.quoteId,
			clientId: clientUser.id,
			orderId: successfulResults[0]?.value.id,
		});
		expect(persistedQuote?.consumedAt).toBeInstanceOf(Date);
	});

	it('keeps exactly one active pricing version after concurrent activation attempts', async () => {
		await prisma.pricingVersion.deleteMany({
			where: { status: 'ACTIVE' },
		});

		const firstDraft = await pricingVersions.createDraft(
			makeDefaultOrderPricingVersionInput('Draft one'),
		);
		const secondDraft = await pricingVersions.createDraft(
			makeDefaultOrderPricingVersionInput('Draft two'),
		);

		const results = await Promise.allSettled([
			pricingVersions.activate({
				versionId: firstDraft.id,
				activatedAt: new Date('2026-03-18T11:00:00.000Z'),
			}),
			pricingVersions.activate({
				versionId: secondDraft.id,
				activatedAt: new Date('2026-03-18T11:00:01.000Z'),
			}),
		]);

		expect(
			results.filter((result) => result.status === 'fulfilled').length,
		).toBeGreaterThanOrEqual(1);

		const activeVersions = await prisma.pricingVersion.findMany({
			where: { status: 'ACTIVE' },
		});
		expect(activeVersions).toHaveLength(1);
		expect([firstDraft.id, secondDraft.id]).toContain(activeVersions[0]?.id);
	});

	it('applies payment confirmation and acceptance transitions', async () => {
		const createdOrder = await createQuotedOrder();
		await expect(
			markOrderAsPaidUseCase.execute({ orderId: createdOrder.id }),
		).resolves.toBeUndefined();
		await expect(
			controller.accept(createdOrder.id, boosterUser),
		).resolves.toEqual({
			success: true,
		});

		await expect(controller.get(createdOrder.id, clientUser)).resolves.toEqual({
			id: createdOrder.id,
			status: 'in_progress',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
	});

	it('maps missing order to not found exception', async () => {
		await expect(
			controller.get('missing-order', clientUser),
		).rejects.toBeInstanceOf(OrderNotFoundError);
		await expect(
			markOrderAsPaidUseCase.execute({ orderId: 'missing-order' }),
		).rejects.toBeInstanceOf(OrderNotFoundError);
	});

	it('maps invalid transitions to bad request exception', async () => {
		const createdOrder = await createQuotedOrder();

		await expect(
			controller.accept(createdOrder.id, boosterUser),
		).rejects.toBeInstanceOf(OrderInvalidTransitionError);
	});

	it('rejects selected users that are not boosters', async () => {
		const uniqueSuffix = `client-lookup-${Date.now().toString()}`;
		const nonBooster = await prisma.user.create({
			data: {
				username: uniqueSuffix,
				email: `${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'CLIENT',
			},
		});

		await expect(
			controller.create(
				{
					quoteId: (
						await controller.quote(
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
						)
					).quoteId,
					boosterId: nonBooster.id,
				},
				clientUser,
			),
		).rejects.toBeInstanceOf(OrderBoosterNotEligibleError);
	});

	it('persists credentials after payment confirmation', async () => {
		const createdOrder = await createQuotedOrder();
		await markOrderAsPaidUseCase.execute({ orderId: createdOrder.id });
		await expect(
			controller.saveCredentials(
				createdOrder.id,
				{
					login: 'login-db',
					summonerName: 'summoner-db',
					password: 'secret-db',
					confirmPassword: 'secret-db',
				},
				clientUser,
			),
		).resolves.toEqual({ success: true });

		const credentials = await prisma.orderCredentials.findUnique({
			where: { orderId: createdOrder.id },
		});
		expect(credentials).toMatchObject({
			orderId: createdOrder.id,
		});
		expect(credentials?.login).not.toBe('login-db');
		expect(credentials?.summonerName).not.toBe('summoner-db');
		expect(credentials?.password).not.toBe('secret-db');

		await expect(
			orderRepository.findById(createdOrder.id),
		).resolves.toMatchObject({
			id: createdOrder.id,
			credentials: {
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
			},
		});
	});

	it('deletes credentials after order completion', async () => {
		const createdOrder = await createQuotedOrder();
		await markOrderAsPaidUseCase.execute({ orderId: createdOrder.id });
		await controller.saveCredentials(
			createdOrder.id,
			{
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
				confirmPassword: 'secret-db',
			},
			clientUser,
		);
		await controller.accept(createdOrder.id, boosterUser);
		await controller.complete(createdOrder.id, boosterUser);

		const credentials = await prisma.orderCredentials.findUnique({
			where: { orderId: createdOrder.id },
		});
		expect(credentials).toBeNull();
		await expect(controller.get(createdOrder.id, clientUser)).resolves.toEqual({
			id: createdOrder.id,
			status: 'completed',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
	});

	it('rejects credentials before payment confirmation', async () => {
		const createdOrder = await createQuotedOrder();

		await expect(
			controller.saveCredentials(
				createdOrder.id,
				{
					login: 'login-db',
					summonerName: 'summoner-db',
					password: 'secret-db',
					confirmPassword: 'secret-db',
				},
				clientUser,
			),
		).rejects.toBeInstanceOf(OrderCredentialsStorageNotAllowedError);
	});
});
