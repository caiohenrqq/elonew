import { PrismaService } from '@app/common/prisma/prisma.service';
import { OrdersModule } from '@modules/orders/orders.module';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

describe('Orders module integration (db)', () => {
	let moduleRef: TestingModule;
	let controller: OrdersController;
	let prisma: PrismaService;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [OrdersModule],
		}).compile();

		controller = moduleRef.get(OrdersController);
		prisma = moduleRef.get(PrismaService);
		await prisma.payment.deleteMany();
		await prisma.order.deleteMany();
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates and fetches an order', async () => {
		await expect(controller.create({ orderId: 'order-db-1' })).resolves.toEqual(
			{
				id: 'order-db-1',
				status: 'awaiting_payment',
			},
		);

		await expect(controller.get('order-db-1')).resolves.toEqual({
			id: 'order-db-1',
			status: 'awaiting_payment',
		});
	});

	it('applies payment confirmation and acceptance transitions', async () => {
		await controller.create({ orderId: 'order-db-2' });
		await expect(controller.confirmPayment('order-db-2')).resolves.toEqual({
			success: true,
		});
		await expect(controller.accept('order-db-2')).resolves.toEqual({
			success: true,
		});

		await expect(controller.get('order-db-2')).resolves.toEqual({
			id: 'order-db-2',
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
		await controller.create({ orderId: 'order-db-3' });

		await expect(controller.accept('order-db-3')).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});

	it('persists credentials after payment confirmation', async () => {
		await controller.create({ orderId: 'order-db-4' });
		await controller.confirmPayment('order-db-4');
		await expect(
			controller.saveCredentials('order-db-4', {
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
				confirmPassword: 'secret-db',
			}),
		).resolves.toEqual({ success: true });

		const credentials = await prisma.orderCredentials.findUnique({
			where: { orderId: 'order-db-4' },
		});
		expect(credentials).toMatchObject({
			orderId: 'order-db-4',
			login: 'login-db',
			summonerName: 'summoner-db',
			password: 'secret-db',
		});
	});

	it('deletes credentials after order completion', async () => {
		await controller.create({ orderId: 'order-db-5' });
		await controller.confirmPayment('order-db-5');
		await controller.saveCredentials('order-db-5', {
			login: 'login-db',
			summonerName: 'summoner-db',
			password: 'secret-db',
			confirmPassword: 'secret-db',
		});
		await controller.accept('order-db-5');
		await controller.complete('order-db-5');

		const credentials = await prisma.orderCredentials.findUnique({
			where: { orderId: 'order-db-5' },
		});
		expect(credentials).toBeNull();
		await expect(controller.get('order-db-5')).resolves.toEqual({
			id: 'order-db-5',
			status: 'completed',
		});
	});

	it('rejects credentials before payment confirmation', async () => {
		await controller.create({ orderId: 'order-db-6' });

		await expect(
			controller.saveCredentials('order-db-6', {
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
				confirmPassword: 'secret-db',
			}),
		).rejects.toBeInstanceOf(BadRequestException);
	});
});
