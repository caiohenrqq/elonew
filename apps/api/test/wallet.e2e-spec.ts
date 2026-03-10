import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { InMemoryWalletRepository } from '@modules/wallet/infrastructure/repositories/in-memory-wallet.repository';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Wallet (e2e)', () => {
	let app: INestApplication;
	let creditCompletedOrderEarningsUseCase: CreditCompletedOrderEarningsUseCase;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(WALLET_REPOSITORY_KEY)
			.useClass(InMemoryWalletRepository)
			.compile();

		app = moduleRef.createNestApplication();
		await app.init();
		creditCompletedOrderEarningsUseCase = moduleRef.get(
			CreditCompletedOrderEarningsUseCase,
		);
	});

	afterEach(async () => {
		await app.close();
	});

	it('returns 404 for an unknown wallet', async () => {
		await request(app.getHttpServer())
			.get('/wallets/missing-booster')
			.expect(404, {
				message: 'Wallet not found.',
				error: 'Not Found',
				statusCode: 404,
			});
	});

	it('returns 400 when withdrawing more than the withdrawable balance', async () => {
		await creditCompletedOrderEarningsUseCase.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
			amount: 70,
			completedAt: new Date('2026-03-09T12:00:00.000Z'),
			lockPeriodInHours: 72,
		});

		await request(app.getHttpServer())
			.post('/wallets/booster-1/withdrawals')
			.send({
				amount: 10,
				requestedAt: '2026-03-10T00:00:00.000Z',
			})
			.expect(400, {
				message: 'Wallet does not have enough withdrawable balance.',
				error: 'Bad Request',
				statusCode: 400,
			});
	});
});
