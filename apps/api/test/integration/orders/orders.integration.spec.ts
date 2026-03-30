import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { BOOSTER_USER_READER_KEY } from '@modules/orders/application/ports/booster-user-reader.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import {
	OrderBoosterNotEligibleError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { InMemoryOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-checkout.repository';
import { InMemoryOrderQuoteRepository } from '@modules/orders/infrastructure/repositories/in-memory-order-quote.repository';
import { OrdersModule } from '@modules/orders/orders.module';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';

describe('Orders module integration', () => {
	let controller: OrdersController;
	let orderRepository: InMemoryOrderRepository;
	const clientUser: AuthenticatedUser = {
		id: 'client-1',
		role: Role.CLIENT,
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
		const moduleRef = await Test.createTestingModule({
			imports: [OrdersModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.overrideProvider(ORDER_CHECKOUT_PORT_KEY)
			.useClass(InMemoryOrderCheckoutRepository)
			.overrideProvider(ORDER_QUOTE_REPOSITORY_KEY)
			.useClass(InMemoryOrderQuoteRepository)
			.overrideProvider(BOOSTER_USER_READER_KEY)
			.useClass(BoosterLookupStub)
			.compile();

		controller = moduleRef.get(OrdersController);
		orderRepository = moduleRef.get(ORDER_REPOSITORY_KEY);
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

		await expect(controller.confirmPayment(createdOrder.id)).resolves.toEqual({
			success: true,
		});
		await expect(
			controller.saveCredentials(createdOrder.id, {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
		).resolves.toEqual({ success: true });
		await expect(controller.accept(createdOrder.id)).resolves.toEqual({
			success: true,
		});
		await expect(controller.complete(createdOrder.id)).resolves.toEqual({
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

	it('applies payment confirmation and acceptance transitions', async () => {
		const createdOrder = await createQuotedOrder();
		await expect(controller.confirmPayment(createdOrder.id)).resolves.toEqual({
			success: true,
		});
		await expect(
			controller.saveCredentials(createdOrder.id, {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
		).resolves.toEqual({ success: true });
		await expect(controller.reject(createdOrder.id)).resolves.toEqual({
			success: true,
		});
		await expect(controller.accept(createdOrder.id)).resolves.toEqual({
			success: true,
		});
		await expect(controller.complete(createdOrder.id)).resolves.toEqual({
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
			controller.confirmPayment('missing-order'),
		).rejects.toBeInstanceOf(OrderNotFoundError);
	});

	it('surfaces invalid-transition domain errors for direct controller calls', async () => {
		const createdOrder = await createQuotedOrder();

		await expect(controller.accept(createdOrder.id)).rejects.toBeInstanceOf(
			OrderInvalidTransitionError,
		);
		await expect(
			controller.saveCredentials(createdOrder.id, {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
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
