import { createHmac } from 'node:crypto';
import { WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { InMemoryWalletRepository } from './support/in-memory/wallet/in-memory-wallet.repository';

describe('Wallets (e2e)', () => {
	let app: ApiHttpApp;
	const scheduler = {
		scheduleRelease: jest.fn().mockResolvedValue(undefined),
	};

	function getJwtSecret(): string {
		return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';
	}

	function getInternalApiKey(): string {
		return process.env.INTERNAL_API_KEY ?? 'dev-internal-api-key';
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
		scheduler.scheduleRelease.mockClear();

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(WALLET_REPOSITORY_KEY)
			.useClass(InMemoryWalletRepository)
			.overrideProvider(WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY)
			.useValue(scheduler)
			.compile();

		app = await createTestHttpApp(moduleRef);
	});

	afterEach(async () => {
		if (!app) return;
		await app.close();
	});

	it('rejects completed-order credit payloads missing orderId', async () => {
		await requestHttp(app)
			.post('/wallets/credits/order-completed')
			.set('x-internal-api-key', getInternalApiKey())
			.send({
				boosterId: 'booster-1',
				amount: 70,
				completedAt: '2026-03-10T00:00:00.000Z',
				lockPeriodInHours: 72,
			})
			.expect(400)
			.execute();
	});

	it('rejects release-matured-funds payloads missing orderId', async () => {
		await requestHttp(app)
			.post('/wallets/internal/release-matured-funds')
			.set('x-internal-api-key', getInternalApiKey())
			.send({
				boosterId: 'booster-1',
				now: '2026-03-10T00:00:00.000Z',
			})
			.expect(400)
			.execute();
	});

	it('rejects withdrawal payloads missing requestedAt', async () => {
		const token = signToken({ sub: 'booster-1', role: Role.BOOSTER });

		await requestHttp(app)
			.post('/wallets/credits/order-completed')
			.set('x-internal-api-key', getInternalApiKey())
			.send({
				orderId: 'order-1',
				boosterId: 'booster-1',
				amount: 70,
				completedAt: '2026-03-10T00:00:00.000Z',
				lockPeriodInHours: 0,
			})
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post('/wallets/internal/release-matured-funds')
			.set('x-internal-api-key', getInternalApiKey())
			.send({
				orderId: 'order-1',
				boosterId: 'booster-1',
				now: '2026-03-10T00:00:00.000Z',
			})
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post('/wallets/booster-1/withdrawals')
			.set('Authorization', `Bearer ${token}`)
			.send({
				amount: 10,
			})
			.expect(400)
			.execute();
	});

	it('rejects malformed booster ids with bad request', async () => {
		const token = signToken({ sub: 'booster-1', role: Role.BOOSTER });

		await requestHttp(app)
			.get('/wallets/%20')
			.set('Authorization', `Bearer ${token}`)
			.expect(400)
			.execute();

		await requestHttp(app)
			.post('/wallets/%20/withdrawals')
			.set('Authorization', `Bearer ${token}`)
			.send({
				amount: 10,
				requestedAt: '2026-03-10T00:00:00.000Z',
			})
			.expect(400)
			.execute();
	});

	it('rejects wallet reads without authentication', async () => {
		await requestHttp(app).get('/wallets/booster-1').expect(401).execute();
	});

	it('rejects wallet reads for authenticated users without booster role', async () => {
		const token = signToken({ sub: 'client-1', role: Role.CLIENT });

		await requestHttp(app)
			.get('/wallets/booster-1')
			.set('Authorization', `Bearer ${token}`)
			.expect(403)
			.execute();
	});

	it('rejects internal wallet routes without the internal api key', async () => {
		await requestHttp(app)
			.post('/wallets/credits/order-completed')
			.send({
				orderId: 'order-1',
				boosterId: 'booster-1',
				amount: 70,
				completedAt: '2026-03-10T00:00:00.000Z',
				lockPeriodInHours: 72,
			})
			.expect(401)
			.execute();

		await requestHttp(app)
			.post('/wallets/internal/release-matured-funds')
			.send({
				orderId: 'order-1',
				boosterId: 'booster-1',
				now: '2026-03-10T00:00:00.000Z',
			})
			.expect(401)
			.execute();
	});

	it('rejects accessing another booster wallet with not found', async () => {
		const token = signToken({ sub: 'booster-2', role: Role.BOOSTER });

		await requestHttp(app)
			.get('/wallets/booster-1')
			.set('Authorization', `Bearer ${token}`)
			.expect(404, {
				message: 'Wallet not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});
});
