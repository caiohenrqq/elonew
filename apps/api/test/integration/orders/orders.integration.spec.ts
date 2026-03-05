import { OrdersModule } from '@modules/orders/orders.module';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('Orders module integration', () => {
	let controller: OrdersController;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [OrdersModule],
		}).compile();

		controller = moduleRef.get(OrdersController);
	});

	it('creates and fetches an order', async () => {
		await expect(controller.create({ orderId: 'order-1' })).resolves.toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
		});

		await expect(controller.get('order-1')).resolves.toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
		});
	});

	it('applies payment confirmation and acceptance transitions', async () => {
		await controller.create({ orderId: 'order-2' });
		await expect(controller.confirmPayment('order-2')).resolves.toEqual({
			success: true,
		});
		await expect(controller.accept('order-2')).resolves.toEqual({
			success: true,
		});

		await expect(controller.get('order-2')).resolves.toEqual({
			id: 'order-2',
			status: 'in_progress',
		});
	});

	it('maps missing order to not found exception', async () => {
		await expect(controller.get('missing-order')).rejects.toBeInstanceOf(
			NotFoundException,
		);
		await expect(
			controller.confirmPayment('missing-order'),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it('maps invalid transitions to bad request exception', async () => {
		await controller.create({ orderId: 'order-3' });

		await expect(controller.accept('order-3')).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});
});
