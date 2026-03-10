import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();
	private nextId = 1;

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async create(order: Order): Promise<Order> {
		const createdOrder = Order.rehydrate({
			id: `order-${this.nextId++}`,
			clientId: order.clientId,
			status: order.status,
			requestDetails: order.requestDetails,
		});
		this.orders.set(createdOrder.id, createdOrder);
		return createdOrder;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}
}

describe('CreateOrderUseCase', () => {
	it('creates an order with authenticated client data and FR-013 details', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new CreateOrderUseCase(repository);

		const createdOrder = await useCase.execute({
			clientId: 'client-1',
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
		});

		expect(createdOrder).toMatchObject({
			id: expect.any(String),
			status: 'awaiting_payment',
		});

		await expect(repository.findById(createdOrder.id)).resolves.toMatchObject({
			id: createdOrder.id,
			clientId: 'client-1',
			status: 'awaiting_payment',
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
		});
	});
});
