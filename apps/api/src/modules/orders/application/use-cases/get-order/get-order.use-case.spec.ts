import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';

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

describe('GetOrderUseCase', () => {
	it('returns order snapshot when order exists', async () => {
		const repository = new InMemoryOrderRepository();
		repository.insert(Order.create('order-1'));
		const useCase = new GetOrderUseCase(repository);

		const foundOrder = await useCase.execute({ orderId: 'order-1' });

		expect(foundOrder).toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
		});
	});

	it('returns null when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new GetOrderUseCase(repository);

		const foundOrder = await useCase.execute({ orderId: 'missing-order' });

		expect(foundOrder).toBeNull();
	});
});
