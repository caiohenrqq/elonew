import type { OrderCompletionEarningsPort } from '@modules/orders/application/ports/order-completion-earnings.port';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
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

class InMemoryOrderCompletionEarningsPort
	implements OrderCompletionEarningsPort
{
	readonly calls: Array<{
		orderId: string;
		boosterId: string;
		completedAt: Date;
	}> = [];

	async creditCompletedOrderEarnings(input: {
		orderId: string;
		boosterId: string;
		completedAt: Date;
	}): Promise<void> {
		this.calls.push(input);
	}
}

describe('CompleteOrderUseCase', () => {
	it('completes order and deletes persisted credentials', async () => {
		const repository = new InMemoryOrderRepository();
		const earningsPort = new InMemoryOrderCompletionEarningsPort();
		const order = Order.create('order-1');
		order.confirmPayment();
		order.setCredentials({
			login: 'login',
			summonerName: 'summoner',
			password: 'secret',
		});
		order.acceptByBooster();
		repository.insert(order);

		const useCase = new CompleteOrderUseCase(repository, earningsPort);
		await useCase.execute({ orderId: 'order-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('completed');
		expect(savedOrder?.credentials).toBeNull();
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const earningsPort = new InMemoryOrderCompletionEarningsPort();
		const useCase = new CompleteOrderUseCase(repository, earningsPort);

		await expect(useCase.execute({ orderId: 'missing-order' })).rejects.toThrow(
			OrderNotFoundError,
		);
	});

	it('throws when order is not in progress', async () => {
		const repository = new InMemoryOrderRepository();
		const earningsPort = new InMemoryOrderCompletionEarningsPort();
		const order = Order.create('order-2');
		order.confirmPayment();
		repository.insert(order);
		const useCase = new CompleteOrderUseCase(repository, earningsPort);

		await expect(useCase.execute({ orderId: 'order-2' })).rejects.toThrow(
			OrderInvalidTransitionError,
		);
	});

	it('completes order when credentials are already null', async () => {
		const repository = new InMemoryOrderRepository();
		const earningsPort = new InMemoryOrderCompletionEarningsPort();
		const order = Order.create('order-3');
		order.confirmPayment();
		order.acceptByBooster();
		repository.insert(order);
		const useCase = new CompleteOrderUseCase(repository, earningsPort);

		await expect(
			useCase.execute({ orderId: 'order-3' }),
		).resolves.toBeUndefined();
		await expect(repository.findById('order-3')).resolves.toMatchObject({
			id: 'order-3',
			status: 'completed',
			credentials: null,
		});
	});

	it('credits booster earnings when a completed order has an assigned booster', async () => {
		const repository = new InMemoryOrderRepository();
		const earningsPort = new InMemoryOrderCompletionEarningsPort();
		const order = Order.create('order-4', { boosterId: 'booster-1' });
		order.confirmPayment();
		order.acceptByBooster();
		repository.insert(order);

		const useCase = new CompleteOrderUseCase(repository, earningsPort);
		await useCase.execute({ orderId: 'order-4' });

		expect(earningsPort.calls).toHaveLength(1);
		expect(earningsPort.calls[0]).toMatchObject({
			orderId: 'order-4',
			boosterId: 'booster-1',
		});
		expect(earningsPort.calls[0]?.completedAt).toBeInstanceOf(Date);
	});
});
