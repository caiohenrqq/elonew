import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { PaymentsModule } from '@modules/payments/payments.module';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Test } from '@nestjs/testing';

describe('Payments module integration', () => {
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [PaymentsModule],
		}).compile();

		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
	});

	it('creates and fetches a payment with 70% booster share', async () => {
		await ordersController.create({ orderId: 'order-1' });

		await expect(
			paymentsController.create({
				paymentId: 'payment-1',
				orderId: 'order-1',
				grossAmount: 100,
			}),
		).resolves.toEqual({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});

		await expect(paymentsController.get('payment-1')).resolves.toEqual({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});
	});

	it('keeps payment held until order completion', async () => {
		await ordersController.create({ orderId: 'order-2' });
		await paymentsController.create({
			paymentId: 'payment-2',
			orderId: 'order-2',
			grossAmount: 100,
		});
		await paymentsController.confirm('payment-2');

		await expect(paymentsController.release('payment-2')).rejects.toThrow(
			'Payment hold can only be released after order completion.',
		);
	});

	it('treats repeated confirm endpoint calls as idempotent', async () => {
		await ordersController.create({ orderId: 'order-3' });
		await paymentsController.create({
			paymentId: 'payment-3',
			orderId: 'order-3',
			grossAmount: 100,
		});

		await expect(paymentsController.confirm('payment-3')).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.confirm('payment-3')).resolves.toEqual({
			success: true,
		});
	});

	it('ignores duplicated webhook event ids', async () => {
		await ordersController.create({ orderId: 'order-4' });
		await paymentsController.create({
			paymentId: 'payment-4',
			orderId: 'order-4',
			grossAmount: 100,
		});

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-1',
				paymentId: 'payment-4',
			}),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-1',
				paymentId: 'payment-4',
			}),
		).resolves.toEqual({ processed: false });

		await expect(paymentsController.get('payment-4')).resolves.toMatchObject({
			id: 'payment-4',
			status: 'held',
		});
	});
});
