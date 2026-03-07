import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import {
	OrderCredentialsPasswordMismatchError,
	OrderCredentialsStorageNotAllowedError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';

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

describe('SaveOrderCredentialsUseCase', () => {
	it('stores credentials after payment confirmation', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		order.confirmPayment();
		repository.insert(order);
		const useCase = new SaveOrderCredentialsUseCase(repository);

		await useCase.execute({
			orderId: 'order-1',
			login: 'login',
			summonerName: 'summoner',
			password: 'secret',
			confirmPassword: 'secret',
		});

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.credentials).toEqual({
			login: 'login',
			summonerName: 'summoner',
			password: 'secret',
		});
	});

	it('throws when passwords do not match', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-2');
		order.confirmPayment();
		repository.insert(order);
		const useCase = new SaveOrderCredentialsUseCase(repository);

		await expect(
			useCase.execute({
				orderId: 'order-2',
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'different',
			}),
		).rejects.toThrow(OrderCredentialsPasswordMismatchError);
	});

	it('throws when trying to store credentials before payment confirmation', async () => {
		const repository = new InMemoryOrderRepository();
		repository.insert(Order.create('order-3'));
		const useCase = new SaveOrderCredentialsUseCase(repository);

		await expect(
			useCase.execute({
				orderId: 'order-3',
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
		).rejects.toThrow(OrderCredentialsStorageNotAllowedError);
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new SaveOrderCredentialsUseCase(repository);

		await expect(
			useCase.execute({
				orderId: 'missing-order',
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
		).rejects.toThrow(OrderNotFoundError);
	});

	it('overwrites credentials when called multiple times for the same order', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-4');
		order.confirmPayment();
		repository.insert(order);
		const useCase = new SaveOrderCredentialsUseCase(repository);

		await useCase.execute({
			orderId: 'order-4',
			login: 'login-1',
			summonerName: 'summoner-1',
			password: 'secret-1',
			confirmPassword: 'secret-1',
		});
		await useCase.execute({
			orderId: 'order-4',
			login: 'login-2',
			summonerName: 'summoner-2',
			password: 'secret-2',
			confirmPassword: 'secret-2',
		});

		const savedOrder = await repository.findById('order-4');
		expect(savedOrder?.credentials).toEqual({
			login: 'login-2',
			summonerName: 'summoner-2',
			password: 'secret-2',
		});
	});
});
