import { createHmac } from 'node:crypto';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Orders (e2e db)', () => {
	let app: ApiHttpApp;
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
		const now = Math.floor(Date.now() / 1000);
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const body = Buffer.from(
			JSON.stringify({
				issuedAt: now,
				expiresAt: now + 900,
				...payload,
			}),
		).toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${body}`)
			.digest('base64url');

		return `${header}.${body}.${signature}`;
	}

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = await createTestHttpApp(moduleRef);

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

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ id: string; status: string }>(({ body }) => {
				orderId = body.id;
				expect(body.status).toBe('awaiting_payment');
			})
			.execute();

		await requestHttp(app)
			.get(`/orders/${orderId}`)
			.expect(200, { id: orderId, status: 'awaiting_payment' })
			.execute();
	});
});
