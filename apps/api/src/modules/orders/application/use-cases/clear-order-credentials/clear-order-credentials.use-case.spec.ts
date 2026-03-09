import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { ClearOrderCredentialsUseCase } from '@modules/orders/application/use-cases/clear-order-credentials/clear-order-credentials.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';

class InMemoryOrderRepository implements OrderRepositoryPort {
	private readonly orders = new Map<string, Order>();

	async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	async save(order: Order): Promise<void> {
		this.orders.set(order.id, order);
	}

	insert(order: Order): void {
		this.orders.set(order.id, order);
	}
}

describe('ClearOrderCredentialsUseCase', () => {
	it('removes stored credentials from an order', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		order.confirmPayment();
		order.setCredentials({
			login: 'login',
			summonerName: 'summoner',
			password: 'secret',
		});
		repository.insert(order);

		const useCase = new ClearOrderCredentialsUseCase(repository);
		await useCase.execute({ orderId: 'order-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.credentials).toBeNull();
	});

	it('is idempotent when credentials are already absent', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-2');
		order.confirmPayment();
		repository.insert(order);

		const useCase = new ClearOrderCredentialsUseCase(repository);
		await expect(
			useCase.execute({ orderId: 'order-2' }),
		).resolves.toBeUndefined();

		const savedOrder = await repository.findById('order-2');
		expect(savedOrder?.credentials).toBeNull();
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new ClearOrderCredentialsUseCase(repository);

		await expect(useCase.execute({ orderId: 'missing-order' })).rejects.toThrow(
			OrderNotFoundError,
		);
	});
});
