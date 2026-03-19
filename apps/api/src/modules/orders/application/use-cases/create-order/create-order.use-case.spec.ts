import type { OrderCheckoutPort } from '@modules/orders/application/ports/order-checkout.port';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import {
	OrderBoosterNotEligibleError,
	OrderBoosterNotFoundError,
} from '@modules/orders/domain/order.errors';
import { OrderQuoteNotFoundError } from '@modules/orders/domain/order-pricing.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Role } from '@packages/auth/roles/role';

class InMemoryBoosterLookup {
	async findById(id: string): Promise<{ id: string; role: Role } | null> {
		if (id !== 'booster-1') return null;

		return {
			id: 'booster-1',
			role: Role.BOOSTER,
		};
	}
}

class InMemoryMixedUserLookup {
	async findById(id: string): Promise<{ id: string; role: Role } | null> {
		if (id === 'booster-1') return { id, role: Role.BOOSTER };
		if (id === 'client-2') return { id, role: Role.CLIENT };
		return null;
	}
}

class OrderCheckoutStub implements OrderCheckoutPort {
	public nextOrder = Order.rehydrate({
		id: 'order-1',
		clientId: 'client-1',
		boosterId: null,
		status: OrderStatus.AWAITING_PAYMENT,
		requestDetails: {
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: new Date('2026-03-31T00:00:00.000Z'),
		},
		subtotal: 25.2,
		totalAmount: 25.2,
		discountAmount: 0,
	});
	public nextError: Error | null = null;
	public lastInput:
		| {
				orderId: string;
				clientId: string;
				boosterId?: string;
				quoteId: string;
				now: Date;
		  }
		| undefined;

	async createDraftOrderFromOwnedQuote(input: {
		orderId: string;
		clientId: string;
		boosterId?: string;
		quoteId: string;
		now: Date;
	}): Promise<Order> {
		this.lastInput = input;
		if (this.nextError) throw this.nextError;

		return Order.rehydrate({
			id: this.nextOrder.id,
			clientId: this.nextOrder.clientId,
			boosterId: this.nextOrder.boosterId,
			status: this.nextOrder.status,
			requestDetails: this.nextOrder.requestDetails ?? undefined,
			subtotal: this.nextOrder.subtotal,
			totalAmount: this.nextOrder.totalAmount,
			discountAmount: this.nextOrder.discountAmount,
		});
	}
}

describe('CreateOrderUseCase', () => {
	it('creates an order with authenticated client data through the checkout port', async () => {
		const checkout = new OrderCheckoutStub();
		const useCase = new CreateOrderUseCase(
			new InMemoryBoosterLookup() as never,
			checkout,
		);

		const createdOrder = await useCase.execute({
			clientId: 'client-1',
			quoteId: 'quote-1',
			now: new Date('2026-03-18T12:00:00.000Z'),
		});

		expect(createdOrder).toMatchObject({
			id: 'order-1',
			status: 'awaiting_payment',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		expect(checkout.lastInput).toMatchObject({
			clientId: 'client-1',
			quoteId: 'quote-1',
			boosterId: undefined,
			now: new Date('2026-03-18T12:00:00.000Z'),
		});
		expect(checkout.lastInput?.orderId).toEqual(expect.any(String));
	});

	it('surfaces quote errors from the checkout port', async () => {
		const checkout = new OrderCheckoutStub();
		checkout.nextError = new OrderQuoteNotFoundError();
		const useCase = new CreateOrderUseCase(
			new InMemoryBoosterLookup() as never,
			checkout,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				quoteId: 'quote-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
			}),
		).rejects.toThrow(OrderQuoteNotFoundError);
	});

	it('creates an order with a selected booster when the booster is eligible', async () => {
		const checkout = new OrderCheckoutStub();
		checkout.nextOrder = Order.rehydrate({
			id: 'order-99',
			clientId: 'client-1',
			boosterId: 'booster-1',
			status: OrderStatus.AWAITING_PAYMENT,
			requestDetails: {
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				currentLp: 50,
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
				server: 'br',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: new Date('2026-03-31T00:00:00.000Z'),
			},
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		const useCase = new CreateOrderUseCase(
			new InMemoryBoosterLookup() as never,
			checkout,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				boosterId: 'booster-1',
				quoteId: 'quote-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
			}),
		).resolves.toMatchObject({
			id: 'order-99',
			status: 'awaiting_payment',
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		expect(checkout.lastInput?.boosterId).toBe('booster-1');
	});

	it('throws when the selected booster does not exist', async () => {
		const useCase = new CreateOrderUseCase(
			new InMemoryMixedUserLookup() as never,
			new OrderCheckoutStub(),
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				boosterId: 'missing-booster',
				quoteId: 'quote-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
			}),
		).rejects.toThrow(OrderBoosterNotFoundError);
	});

	it('throws when the selected user is not a booster', async () => {
		const useCase = new CreateOrderUseCase(
			new InMemoryMixedUserLookup() as never,
			new OrderCheckoutStub(),
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				boosterId: 'client-2',
				quoteId: 'quote-1',
				now: new Date('2026-03-18T12:00:00.000Z'),
			}),
		).rejects.toThrow(OrderBoosterNotEligibleError);
	});
});
