import type { ChatThreadWriterPort } from '@modules/chat/application/ports/chat-thread-writer.port';
import type {
	OrderEvent,
	OrderEventPublisherPort,
} from '@modules/orders/application/ports/order-event-publisher.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import {
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();

	async create(order: Order): Promise<Order> {
		this.orders.set(order.id, order);
		return order;
	}

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async findByIdForClient(id: string): Promise<Order | null> {
		return this.findById(id);
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

class ChatThreadWriterSpy implements ChatThreadWriterPort {
	readonly orderIds: string[] = [];

	async createOrderChat(
		orderId: string,
	): Promise<{ id: string; orderId: string }> {
		this.orderIds.push(orderId);
		return { id: 'chat-1', orderId };
	}
}

describe('AcceptOrderUseCase', () => {
	it('moves order to in progress when booster accepts a paid order', async () => {
		const repository = new InMemoryOrderRepository();
		const eventPublisher = new OrderEventPublisherSpy();
		const chatThreadWriter = new ChatThreadWriterSpy();
		const order = Order.create('order-1');
		order.confirmPayment();
		repository.insert(order);

		const useCase = new AcceptOrderUseCase(
			repository,
			eventPublisher,
			chatThreadWriter,
		);
		await useCase.execute({ orderId: 'order-1', boosterId: 'booster-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('in_progress');
		expect(savedOrder?.boosterId).toBe('booster-1');
		expect(eventPublisher.events).toMatchObject([
			{
				type: 'order.accepted',
				orderId: 'order-1',
				clientId: null,
				boosterId: 'booster-1',
			},
		]);
		expect(chatThreadWriter.orderIds).toEqual(['order-1']);
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new AcceptOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'missing-order', boosterId: 'booster-1' }),
		).rejects.toThrow(OrderNotFoundError);
	});

	it('throws when order has not been paid yet', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-2');
		repository.insert(order);

		const useCase = new AcceptOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-2', boosterId: 'booster-1' }),
		).rejects.toThrow(OrderInvalidTransitionError);
	});

	it('throws when a different booster tries to accept an assigned order', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-3', { boosterId: 'booster-1' });
		order.confirmPayment();
		repository.insert(order);

		const useCase = new AcceptOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-3', boosterId: 'booster-2' }),
		).rejects.toThrow(OrderNotFoundError);
	});
});
