import { PrismaService } from '@app/common/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { makeDefaultOrderPricingVersionInput } from './order-pricing-version-test-data';
import { signTestAccessToken as signToken } from './support/auth-token';

describe('Orders (e2e db)', () => {
	let app: ApiHttpApp;
	let prisma: PrismaService;
	let clientId: string;

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

	async function seedActivePricingVersion() {
		const input = makeDefaultOrderPricingVersionInput();

		await prisma.pricingVersion.create({
			data: {
				name: input.name,
				status: 'ACTIVE',
				activatedAt: new Date('2026-03-18T10:00:00.000Z'),
				steps: {
					create: input.steps.map((step) => ({
						serviceType:
							step.serviceType === 'elo_boost' ? 'ELO_BOOST' : 'DUO_BOOST',
						league: step.league,
						division: step.division,
						priceToNext: step.priceToNext,
					})),
				},
				extras: {
					create: input.extras.map((extra) => ({
						type: extra.type,
						modifierRate: extra.modifierRate,
					})),
				},
			},
		});
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
		await prisma.orderQuote.deleteMany();
		await prisma.pricingStep.deleteMany();
		await prisma.pricingExtra.deleteMany();
		await prisma.pricingVersion.deleteMany();
		await seedActivePricingVersion();
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
		let quoteId = '';
		let orderId = '';

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ quoteId: string }>(({ body }) => {
				quoteId = body.quoteId;
			})
			.execute();

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId })
			.expect(201)
			.expect<{ id: string; status: string }>(({ body }) => {
				orderId = body.id;
				expect(body.status).toBe('awaiting_payment');
			})
			.execute();

		await requestHttp(app)
			.get(`/orders/${orderId}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200, {
				id: orderId,
				status: 'awaiting_payment',
				subtotal: 2520,
				totalAmount: 2520,
				discountAmount: 0,
				serviceType: 'elo_boost',
				currentLeague: 'gold',
				currentDivision: 'II',
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
			})
			.execute();
	});
});
