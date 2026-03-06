import { PrismaService } from '@app/common/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders (e2e db)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();

		const prisma = moduleRef.get(PrismaService);
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.order.deleteMany();
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates an order and returns it', async () => {
		await request(app.getHttpServer())
			.post('/orders')
			.send({ orderId: 'order-db-1' })
			.expect(201, { id: 'order-db-1', status: 'awaiting_payment' });

		await request(app.getHttpServer())
			.get('/orders/order-db-1')
			.expect(200, { id: 'order-db-1', status: 'awaiting_payment' });
	});
});
