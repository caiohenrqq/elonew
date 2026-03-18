import { WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { InMemoryWalletRepository } from '@modules/wallet/infrastructure/repositories/in-memory-wallet.repository';
import { WalletsController } from '@modules/wallet/presentation/wallets.controller';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Test } from '@nestjs/testing';

describe('Wallet module integration', () => {
	let controller: WalletsController;
	let creditCompletedOrderEarningsUseCase: CreditCompletedOrderEarningsUseCase;
	const scheduler = {
		scheduleRelease: jest.fn().mockResolvedValue(undefined),
	};

	beforeEach(async () => {
		scheduler.scheduleRelease.mockClear();

		const moduleRef = await Test.createTestingModule({
			imports: [WalletModule],
		})
			.overrideProvider(WALLET_REPOSITORY_KEY)
			.useClass(InMemoryWalletRepository)
			.overrideProvider(WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY)
			.useValue(scheduler)
			.compile();

		controller = moduleRef.get(WalletsController);
		creditCompletedOrderEarningsUseCase = moduleRef.get(
			CreditCompletedOrderEarningsUseCase,
		);
	});

	it('returns wallet balances, releases targeted matured funds through the internal endpoint, and allows withdrawal', async () => {
		await creditCompletedOrderEarningsUseCase.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
			amount: 70,
			completedAt: new Date('2026-03-09T12:00:00.000Z'),
			lockPeriodInHours: 72,
		});

		await expect(controller.get('booster-1')).resolves.toEqual({
			boosterId: 'booster-1',
			balanceLocked: 70,
			balanceWithdrawable: 0,
		});

		await expect(
			controller.releaseMaturedFunds({
				orderId: 'order-1',
				boosterId: 'booster-1',
				now: '2026-03-12T12:00:00.000Z',
			}),
		).resolves.toEqual({ success: true });

		await expect(controller.get('booster-1')).resolves.toEqual({
			boosterId: 'booster-1',
			balanceLocked: 0,
			balanceWithdrawable: 70,
		});

		await expect(
			controller.requestWithdrawal('booster-1', {
				amount: 10,
				requestedAt: '2026-03-12T13:00:00.000Z',
			}),
		).resolves.toEqual({ success: true });

		await expect(controller.get('booster-1')).resolves.toEqual({
			boosterId: 'booster-1',
			balanceLocked: 0,
			balanceWithdrawable: 60,
		});

		expect(scheduler.scheduleRelease).toHaveBeenCalledWith({
			orderId: 'order-1',
			boosterId: 'booster-1',
			availableAt: new Date('2026-03-12T12:00:00.000Z'),
		});
	});
});
