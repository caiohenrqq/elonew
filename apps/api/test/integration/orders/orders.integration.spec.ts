import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { BOOSTER_USER_READER_KEY } from '@modules/orders/application/ports/booster-user-reader.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import {
	ORDER_PRICING_VERSION_REPOSITORY_KEY,
	type OrderPricingVersionRepositoryPort,
} from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import {
	OrderBoosterNotEligibleError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import { OrdersModule } from '@modules/orders/orders.module';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { OrdersPricingAdminController } from '@modules/orders/presentation/orders-pricing-admin.controller';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { makeDefaultOrderPricingVersionInput } from '../../order-pricing-version-test-data';
import { InMemoryOrderRepository } from '../../support/in-memory/orders/in-memory-order.repository';
import { InMemoryOrderCheckoutRepository } from '../../support/in-memory/orders/in-memory-order-checkout.repository';
import { InMemoryOrderPricingVersionRepository } from '../../support/in-memory/orders/in-memory-order-pricing-version.repository';
import { InMemoryOrderQuoteRepository } from '../../support/in-memory/orders/in-memory-order-quote.repository';

describe('Orders module integration', () => {
	let moduleRef: TestingModule;
	let controller: OrdersController;
	let pricingAdminController: OrdersPricingAdminController;
	let orderRepository: InMemoryOrderRepository;
	let pricingVersions: OrderPricingVersionRepositoryPort;
	let markOrderAsPaidUseCase: MarkOrderAsPaidUseCase;
	const adminUser: AuthenticatedUser = {
		id: 'admin-1',
		role: Role.ADMIN,
	};
	const clientUser: AuthenticatedUser = {
		id: 'client-1',
		role: Role.CLIENT,
	};
	const boosterUser: AuthenticatedUser = {
		id: 'booster-1',
		role: Role.BOOSTER,
	};

	class BoosterLookupStub {
		async findById(id: string): Promise<{ id: string; role: Role } | null> {
			if (id === 'booster-1') return { id, role: Role.BOOSTER };
			if (id === 'client-2') return { id, role: Role.CLIENT };
			return null;
		}
	}

	function makeQuotePayload() {
		return {
			serviceType: 'elo_boost' as const,
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

	function makePricingVersionInputWithHigherGoldOnePrice(name: string) {
		const input = makeDefaultOrderPricingVersionInput(name);

		return {
			...input,
			steps: input.steps.map((step) =>
				step.serviceType === 'elo_boost' &&
				step.league === 'gold' &&
				step.division === 'I'
					? { ...step, priceToNext: 30 }
					: step,
			),
		};
	}

	async function createQuotedOrder(input?: { boosterId?: string }) {
		const quote = await controller.quote(makeQuotePayload(), clientUser);

		return await controller.create(
			{
				quoteId: quote.quoteId,
				boosterId: input?.boosterId,
			},
			clientUser,
		);
	}

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [OrdersModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.overrideProvider(ORDER_CHECKOUT_PORT_KEY)
			.useClass(InMemoryOrderCheckoutRepository)
			.overrideProvider(ORDER_QUOTE_REPOSITORY_KEY)
			.useClass(InMemoryOrderQuoteRepository)
			.overrideProvider(ORDER_PRICING_VERSION_REPOSITORY_KEY)
			.useClass(InMemoryOrderPricingVersionRepository)
			.overrideProvider(BOOSTER_USER_READER_KEY)
			.useClass(BoosterLookupStub)
			.compile();

		controller = moduleRef.get(OrdersController);
		pricingAdminController = moduleRef.get(OrdersPricingAdminController);
		orderRepository = moduleRef.get(ORDER_REPOSITORY_KEY);
		pricingVersions = moduleRef.get(ORDER_PRICING_VERSION_REPOSITORY_KEY);
		markOrderAsPaidUseCase = moduleRef.get(MarkOrderAsPaidUseCase);
		const version = await pricingVersions.createDraft(
			makeDefaultOrderPricingVersionInput(),
		);
		await pricingVersions.activate({
			versionId: version.id,
			activatedAt: new Date('2026-03-18T10:00:00.000Z'),
		});
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates and fetches an order with authenticated client details', async () => {
		const createdOrder = await createQuotedOrder();

		expect(createdOrder).toMatchObject({
			id: expect.any(String),
			status: 'awaiting_payment',
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

		const persistedOrder = await orderRepository.findById(createdOrder.id);
		expect(persistedOrder).toMatchObject({
			id: createdOrder.id,
			clientId: clientUser.id,
			boosterId: null,
		});
		expect(persistedOrder?.requestDetails?.deadline).toEqual(
			new Date('2026-03-31T00:00:00.000Z'),
		);
		expect(persistedOrder?.requestDetails?.deadline).toBeInstanceOf(Date);
	});

	it('persists selected extras and their pricing impact from quote to order', async () => {
		const quote = await controller.quote(
			{
				...makeQuotePayload(),
				extras: ['mmr_buffed', 'priority_service', 'offline_chat'],
			},
			clientUser,
		);

		expect(quote).toMatchObject({
			subtotal: 36.54,
			totalAmount: 36.54,
			discountAmount: 0,
		});

		const createdOrder = await controller.create(
			{
				quoteId: quote.quoteId,
			},
			clientUser,
		);

		expect(createdOrder).toMatchObject({
			id: expect.any(String),
			subtotal: 36.54,
			totalAmount: 36.54,
			discountAmount: 0,
		});

		await expect(
			orderRepository.findById(createdOrder.id),
		).resolves.toMatchObject({
			extras: [
				{ type: 'mmr_buffed', price: 8.82 },
				{ type: 'priority_service', price: 2.52 },
				{ type: 'offline_chat', price: 0 },
			],
		});
	});

	it('keeps order extras unchanged after creation through later lifecycle transitions', async () => {
		const quote = await controller.quote(
			{
				...makeQuotePayload(),
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

		await expect(
			markOrderAsPaidUseCase.execute({ orderId: createdOrder.id }),
		).resolves.toBeUndefined();
		await expect(
			controller.saveCredentials(
				createdOrder.id,
				{
					login: 'login',
					summonerName: 'summoner',
					password: 'secret',
					confirmPassword: 'secret',
				},
				clientUser,
			),
		).resolves.toEqual({ success: true });
		await expect(
			controller.accept(createdOrder.id, boosterUser),
		).resolves.toEqual({
			success: true,
		});
		await expect(
			controller.complete(createdOrder.id, boosterUser),
		).resolves.toEqual({
			success: true,
		});

		await expect(
			orderRepository.findById(createdOrder.id),
		).resolves.toMatchObject({
			status: 'completed',
			extras: [
				{ type: 'mmr_buffed', price: 8.82 },
				{ type: 'priority_service', price: 2.52 },
				{ type: 'offline_chat', price: 0 },
			],
		});
	});

	it('keeps historical quotes and orders on the original pricing version after a new version is activated', async () => {
		const firstQuote = await controller.quote(makeQuotePayload(), clientUser);

		const secondVersion = await pricingAdminController.create(
			makePricingVersionInputWithHigherGoldOnePrice('Higher gold pricing'),
			adminUser,
		);
		await pricingAdminController.activate(secondVersion.id, adminUser);

		const firstOrder = await controller.create(
			{
				quoteId: firstQuote.quoteId,
			},
			clientUser,
		);

		await expect(
			orderRepository.findById(firstOrder.id),
		).resolves.toMatchObject({
			subtotal: 25.2,
			pricingVersionId: expect.any(String),
		});

		const secondQuote = await controller.quote(makeQuotePayload(), clientUser);
		expect(secondQuote).toMatchObject({
			subtotal: 38.4,
			totalAmount: 38.4,
			discountAmount: 0,
		});

		const secondOrder = await controller.create(
			{
				quoteId: secondQuote.quoteId,
			},
			clientUser,
		);

		const persistedFirstOrder = await orderRepository.findById(firstOrder.id);
		const persistedSecondOrder = await orderRepository.findById(secondOrder.id);
		expect(persistedFirstOrder?.pricingVersionId).not.toBeNull();
		expect(persistedSecondOrder?.pricingVersionId).not.toBeNull();
		expect(persistedSecondOrder?.pricingVersionId).not.toBe(
			persistedFirstOrder?.pricingVersionId,
		);
		expect(persistedFirstOrder).toMatchObject({
			subtotal: 25.2,
			totalAmount: 25.2,
		});
		expect(persistedSecondOrder).toMatchObject({
			subtotal: 38.4,
			totalAmount: 38.4,
		});
	});

	it('applies payment confirmation and acceptance transitions', async () => {
		const createdOrder = await createQuotedOrder();
		await expect(
			markOrderAsPaidUseCase.execute({ orderId: createdOrder.id }),
		).resolves.toBeUndefined();
		await expect(
			controller.saveCredentials(
				createdOrder.id,
				{
					login: 'login',
					summonerName: 'summoner',
					password: 'secret',
					confirmPassword: 'secret',
				},
				clientUser,
			),
		).resolves.toEqual({ success: true });
		await expect(
			controller.reject(createdOrder.id, boosterUser),
		).resolves.toEqual({
			success: true,
		});
		await expect(
			controller.accept(createdOrder.id, boosterUser),
		).resolves.toEqual({
			success: true,
		});
		await expect(
			controller.complete(createdOrder.id, boosterUser),
		).resolves.toEqual({
			success: true,
		});

		await expect(controller.get(createdOrder.id, clientUser)).resolves.toEqual({
			id: createdOrder.id,
			status: 'completed',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
	});

	it('creates an order with a selected booster and persists the booster id', async () => {
		const createdOrder = await createQuotedOrder({ boosterId: 'booster-1' });

		await expect(
			orderRepository.findById(createdOrder.id),
		).resolves.toMatchObject({
			id: createdOrder.id,
			boosterId: 'booster-1',
		});
	});

	it('surfaces not-found domain errors for direct controller calls', async () => {
		await expect(
			controller.get('missing-order', clientUser),
		).rejects.toBeInstanceOf(OrderNotFoundError);
		await expect(
			markOrderAsPaidUseCase.execute({ orderId: 'missing-order' }),
		).rejects.toBeInstanceOf(OrderNotFoundError);
	});

	it('surfaces invalid-transition domain errors for direct controller calls', async () => {
		const createdOrder = await createQuotedOrder();

		await expect(
			controller.accept(createdOrder.id, boosterUser),
		).rejects.toBeInstanceOf(OrderInvalidTransitionError);
		await expect(
			controller.saveCredentials(
				createdOrder.id,
				{
					login: 'login',
					summonerName: 'summoner',
					password: 'secret',
					confirmPassword: 'secret',
				},
				clientUser,
			),
		).rejects.toBeInstanceOf(OrderCredentialsStorageNotAllowedError);
	});

	it('rejects selected users that are not boosters', async () => {
		await expect(
			controller.create(
				{
					quoteId: (await controller.quote(makeQuotePayload(), clientUser))
						.quoteId,
					boosterId: 'client-2',
				},
				clientUser,
			),
		).rejects.toBeInstanceOf(OrderBoosterNotEligibleError);
	});
});
