import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderAlreadyExistsError } from '@modules/orders/domain/order.errors';

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

describe('CreateOrderUseCase', () => {
	it('creates an order with awaiting payment status', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new CreateOrderUseCase(repository);

		const createdOrder = await useCase.execute({ orderId: 'order-1' });

		expect(createdOrder).toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
		});
	});

	it('throws when order id already exists', async () => {
		const repository = new InMemoryOrderRepository();
		repository.insert(Order.create('order-1'));
		const useCase = new CreateOrderUseCase(repository);

		await expect(useCase.execute({ orderId: 'order-1' })).rejects.toThrow(
			OrderAlreadyExistsError,
		);
	});
});
