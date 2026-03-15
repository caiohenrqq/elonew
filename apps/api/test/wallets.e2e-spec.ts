import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { InMemoryWalletRepository } from '@modules/wallet/infrastructure/repositories/in-memory-wallet.repository';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Wallets (e2e)', () => {
	let app: ApiHttpApp;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(WALLET_REPOSITORY_KEY)
			.useClass(InMemoryWalletRepository)
			.compile();

		app = await createTestHttpApp(moduleRef);
	});

	afterEach(async () => {
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

	it('rejects release-matured-funds payloads missing now', async () => {
		await requestHttp(app)
			.post('/wallets/internal/release-matured-funds')
			.send({})
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
});
