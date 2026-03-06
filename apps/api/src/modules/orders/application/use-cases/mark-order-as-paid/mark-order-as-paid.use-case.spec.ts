import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
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

describe('MarkOrderAsPaidUseCase', () => {
	it('moves order to pending booster when payment is confirmed', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-1');
		repository.insert(order);

		const useCase = new MarkOrderAsPaidUseCase(repository);
		await useCase.execute({ orderId: 'order-1' });

		const savedOrder = await repository.findById('order-1');
		expect(savedOrder?.status).toBe('pending_booster');
	});

	it('throws when order does not exist', async () => {
		const repository = new InMemoryOrderRepository();
		const useCase = new MarkOrderAsPaidUseCase(repository);

		await expect(useCase.execute({ orderId: 'missing-order' })).rejects.toThrow(
			OrderNotFoundError,
		);
	});

	it('is idempotent when provider retries payment confirmation', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.create('order-2');
		repository.insert(order);
		const useCase = new MarkOrderAsPaidUseCase(repository);

		await useCase.execute({ orderId: 'order-2' });

		await expect(
			useCase.execute({ orderId: 'order-2' }),
		).resolves.toBeUndefined();
		await expect(repository.findById('order-2')).resolves.toMatchObject({
			id: 'order-2',
			status: 'pending_booster',
		});
	});
});
