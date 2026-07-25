import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { InMemoryOrderRepository } from '../../../../../../test/support/in-memory/orders/in-memory-order.repository';

describe('GetOrderUseCase', () => {
	it('returns the owned order summary when the order exists', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			status: 'awaiting_payment' as never,
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		await repository.create(order);

		const useCase = new GetOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).resolves.toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
			hasCredentials: false,
			summonerName: null,
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
			serviceType: null,
			currentLeague: null,
			currentDivision: null,
			currentLp: null,
			desiredLeague: null,
			desiredDivision: null,
			server: null,
			desiredQueue: null,
			lpGain: null,
			deadline: null,
			extras: [],
			booster: null,
		});
	});

	it('throws when the order belongs to another client', async () => {
		const repository = new InMemoryOrderRepository();
		const order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-2',
			status: 'awaiting_payment' as never,
			subtotal: 25.2,
			totalAmount: 25.2,
			discountAmount: 0,
		});
		await repository.create(order);
		const useCase = new GetOrderUseCase(repository);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(OrderNotFoundError);
	});
});
