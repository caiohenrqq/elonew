import { PrismaService } from '@app/common/prisma/prisma.service';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { PaymentsModule } from '@modules/payments/payments.module';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

describe('Payments module integration (db)', () => {
	let moduleRef: TestingModule;
	let ordersController: OrdersController;
	let paymentsController: PaymentsController;
	let prisma: PrismaService;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [PaymentsModule],
		}).compile();

		ordersController = moduleRef.get(OrdersController);
		paymentsController = moduleRef.get(PaymentsController);
		prisma = moduleRef.get(PrismaService);
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.order.deleteMany();
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates and fetches a payment with 70% booster share', async () => {
		await ordersController.create({ orderId: 'order-db-1' });

		await expect(
			paymentsController.create({
				paymentId: 'payment-db-1',
				orderId: 'order-db-1',
				grossAmount: 100,
			}),
		).resolves.toEqual({
			id: 'payment-db-1',
			orderId: 'order-db-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});

		await expect(paymentsController.get('payment-db-1')).resolves.toEqual({
			id: 'payment-db-1',
			orderId: 'order-db-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
		});
	});

	it('keeps payment held until order completion', async () => {
		await ordersController.create({ orderId: 'order-db-2' });
		await paymentsController.create({
			paymentId: 'payment-db-2',
			orderId: 'order-db-2',
			grossAmount: 100,
		});
		await paymentsController.confirm('payment-db-2');

		await expect(paymentsController.release('payment-db-2')).rejects.toThrow(
			'Payment hold can only be released after order completion.',
		);
	});

	it('treats repeated confirm endpoint calls as idempotent', async () => {
		await ordersController.create({ orderId: 'order-db-3' });
		await paymentsController.create({
			paymentId: 'payment-db-3',
			orderId: 'order-db-3',
			grossAmount: 100,
		});

		await expect(paymentsController.confirm('payment-db-3')).resolves.toEqual({
			success: true,
		});
		await expect(paymentsController.confirm('payment-db-3')).resolves.toEqual({
			success: true,
		});
	});

	it('ignores duplicated webhook event ids', async () => {
		await ordersController.create({ orderId: 'order-db-4' });
		await paymentsController.create({
			paymentId: 'payment-db-4',
			orderId: 'order-db-4',
			grossAmount: 100,
		});

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-db-1',
				paymentId: 'payment-db-4',
			}),
		).resolves.toEqual({ processed: true });

		await expect(
			paymentsController.handlePaymentConfirmedWebhook({
				eventId: 'event-db-1',
				paymentId: 'payment-db-4',
			}),
		).resolves.toEqual({ processed: false });

		await expect(paymentsController.get('payment-db-4')).resolves.toMatchObject(
			{
				id: 'payment-db-4',
				status: 'held',
			},
		);
	});
});
