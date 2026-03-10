import { createHmac } from 'node:crypto';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders (e2e db)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let clientId: string;

	function getJwtSecret(): string {
		return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';
	}

	function makeOrderPayload() {
		return {
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: '2026-03-31T00:00:00.000Z',
		};
	}

	function signToken(payload: Record<string, unknown>): string {
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${body}`)
			.digest('base64url');

		return `${header}.${body}.${signature}`;
	}

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();

		prisma = moduleRef.get(PrismaService);
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.order.deleteMany();
		const uniqueSuffix = Date.now().toString();
		const user = await prisma.user.create({
			data: {
				username: `client-e2e-db-${uniqueSuffix}`,
				email: `client-e2e-db-${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'CLIENT',
			},
		});
		clientId = user.id;
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates an authenticated order and returns it', async () => {
		const token = signToken({ sub: clientId, role: 'CLIENT' });
		let orderId = '';

		await request(app.getHttpServer())
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect(({ body }) => {
				orderId = body.id;
				expect(body.status).toBe('awaiting_payment');
			});

		await request(app.getHttpServer())
			.get(`/orders/${orderId}`)
			.expect(200, { id: orderId, status: 'awaiting_payment' });
	});
});
