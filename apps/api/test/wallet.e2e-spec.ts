import { createHmac } from 'node:crypto';
import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { InMemoryWalletRepository } from '@modules/wallet/infrastructure/repositories/in-memory-wallet.repository';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Wallet (e2e)', () => {
	let app: ApiHttpApp;
	let creditCompletedOrderEarningsUseCase: CreditCompletedOrderEarningsUseCase;

	function getJwtSecret(): string {
		return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';
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
		})
			.overrideProvider(WALLET_REPOSITORY_KEY)
			.useClass(InMemoryWalletRepository)
			.compile();

		app = await createTestHttpApp(moduleRef);
		creditCompletedOrderEarningsUseCase = moduleRef.get(
			CreditCompletedOrderEarningsUseCase,
		);
	});

	afterEach(async () => {
		await app.close();
	});

	it('returns 404 for an unknown wallet', async () => {
		const token = signToken({ sub: 'missing-booster', role: Role.BOOSTER });

		await requestHttp(app)
			.get('/wallets/missing-booster')
			.set('Authorization', `Bearer ${token}`)
			.expect(404, {
				message: 'Wallet not found.',
				error: 'Not Found',
				statusCode: 404,
			})
			.execute();
	});

	it('returns 400 when withdrawing more than the withdrawable balance', async () => {
		const token = signToken({ sub: 'booster-1', role: Role.BOOSTER });

		await creditCompletedOrderEarningsUseCase.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
			amount: 70,
			completedAt: new Date('2026-03-09T12:00:00.000Z'),
			lockPeriodInHours: 72,
		});

		await requestHttp(app)
			.post('/wallets/booster-1/withdrawals')
			.set('Authorization', `Bearer ${token}`)
			.send({
				amount: 10,
				requestedAt: '2026-03-10T00:00:00.000Z',
			})
			.expect(400, {
				message: 'Wallet does not have enough withdrawable balance.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('returns 404 when a booster requests another booster wallet', async () => {
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
