import type {
	OrderEvent,
	OrderEventPublisherPort,
} from '@modules/orders/application/ports/order-event-publisher.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();

	async create(order: Order): Promise<Order> {
		this.orders.set(order.id, order);
		return order;
	}

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async findByIdForClient(id: string, clientId: string): Promise<Order | null> {
		const order = await this.findById(id);
		if (!order || order.clientId !== clientId) return null;

		return order;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}

	insert(order: Order): void {
		this.orders.set(order.id, order);
	}
}

class OrderEventPublisherSpy implements OrderEventPublisherPort {
	readonly events: OrderEvent[] = [];

	async publish(event: OrderEvent): Promise<void> {
		this.events.push(event);
	}
}

describe('CancelOrderUseCase', () => {
	it('cancels an order when cancellation is allowed', async () => {
		const repository = new InMemoryOrderRepository();
		const eventPublisher = new OrderEventPublisherSpy();
		const order = Order.create('order-1', { clientId: 'client-1' });
		order.confirmPayment();
		repository.insert(order);

		const useCase = new CancelOrderUseCase(repository, eventPublisher);

		await useCase.execute({ orderId: 'order-1', clientId: 'client-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('cancelled');
		expect(eventPublisher.events).toMatchObject([
			{
				type: 'order.cancelled',
				orderId: 'order-1',
				clientId: 'client-1',
				boosterId: null,
			},
		]);
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new CancelOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'missing-order', clientId: 'client-1' }),
		).rejects.toThrow(OrderNotFoundError);
	});

	it('throws when a different client tries to cancel the order', async () => {
		const repository = new InMemoryOrderRepository();
		repository.insert(Order.create('order-2', { clientId: 'client-1' }));
		const useCase = new CancelOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-2', clientId: 'client-2' }),
		).rejects.toThrow(OrderNotFoundError);
	});
});
