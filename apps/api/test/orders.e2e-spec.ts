import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.compile();

		app = moduleRef.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates an order and returns it', async () => {
		await request(app.getHttpServer())
			.post('/orders')
			.send({ orderId: 'order-1' })
			.expect(201, { id: 'order-1', status: 'awaiting_payment' });

		await request(app.getHttpServer())
			.get('/orders/order-1')
			.expect(200, { id: 'order-1', status: 'awaiting_payment' });
	});

	it('moves order through payment and acceptance flow', async () => {
		await request(app.getHttpServer())
			.post('/orders')
			.send({ orderId: 'order-2' })
			.expect(201);

		await request(app.getHttpServer())
			.post('/orders/order-2/payment-confirmed')
			.expect(200, { success: true });

		await request(app.getHttpServer())
			.post('/orders/order-2/accept')
			.expect(200, { success: true });

		await request(app.getHttpServer())
			.get('/orders/order-2')
			.expect(200, { id: 'order-2', status: 'in_progress' });
	});

	it('returns 404 for unknown order in mutations', async () => {
		await request(app.getHttpServer())
			.post('/orders/missing/cancel')
			.expect(404, {
				message: 'Order not found.',
				error: 'Not Found',
				statusCode: 404,
			});
	});

	it('returns 400 for invalid transition', async () => {
		await request(app.getHttpServer())
			.post('/orders')
			.send({ orderId: 'order-3' })
			.expect(201);

		await request(app.getHttpServer())
			.post('/orders/order-3/accept')
			.expect(400, {
				message: 'Invalid order transition: awaiting_payment -> in_progress.',
				error: 'Bad Request',
				statusCode: 400,
			});
	});
});
