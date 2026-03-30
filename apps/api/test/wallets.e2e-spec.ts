import { WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { InMemoryWalletRepository } from '@modules/wallet/infrastructure/repositories/in-memory-wallet.repository';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Wallets (e2e)', () => {
	let app: ApiHttpApp;
	const scheduler = {
		scheduleRelease: jest.fn().mockResolvedValue(undefined),
	};

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
			.send({
				boosterId: 'booster-1',
				now: '2026-03-10T00:00:00.000Z',
			})
			.expect(400)
			.execute();
	});

	it('rejects withdrawal payloads missing requestedAt', async () => {
		await requestHttp(app)
			.post('/wallets/credits/order-completed')
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
			.send({
				orderId: 'order-1',
				boosterId: 'booster-1',
				now: '2026-03-10T00:00:00.000Z',
			})
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post('/wallets/booster-1/withdrawals')
			.send({
				amount: 10,
			})
			.expect(400)
			.execute();
	});

	it('rejects malformed booster ids with bad request', async () => {
		await requestHttp(app).get('/wallets/%20').expect(400).execute();

		await requestHttp(app)
			.post('/wallets/%20/withdrawals')
			.send({
				amount: 10,
				requestedAt: '2026-03-10T00:00:00.000Z',
			})
			.expect(400)
			.execute();
	});
});
