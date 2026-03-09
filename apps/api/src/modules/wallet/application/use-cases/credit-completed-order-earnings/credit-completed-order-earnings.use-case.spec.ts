import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { Wallet } from '@modules/wallet/domain/wallet.entity';

class InMemoryWalletRepository implements WalletRepositoryPort {
	private readonly wallets = new Map<string, Wallet>();

	async findByBoosterId(boosterId: string): Promise<Wallet | null> {
		return this.wallets.get(boosterId) ?? null;
	}

	async findAll(): Promise<Wallet[]> {
		return [...this.wallets.values()];
	}

	async save(wallet: Wallet): Promise<void> {
		this.wallets.set(wallet.boosterId, wallet);
	}
}

describe('CreditCompletedOrderEarningsUseCase', () => {
	it('credits completed order earnings into locked balance with an availability date', async () => {
		const repository = new InMemoryWalletRepository();
		const useCase = new CreditCompletedOrderEarningsUseCase(repository);
		const completedAt = new Date('2026-03-09T12:00:00.000Z');

		await useCase.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
			amount: 70,
			completedAt,
			lockPeriodInHours: 72,
		});

		await expect(
			repository.findByBoosterId('booster-1'),
		).resolves.toMatchObject({
			boosterId: 'booster-1',
			balanceLocked: 70,
			balanceWithdrawable: 0,
			transactions: [
				{
					orderId: 'order-1',
					amount: 70,
					type: 'credit',
					reason: 'order_completion',
					availableAt: new Date('2026-03-12T12:00:00.000Z'),
					releasedAt: null,
				},
			],
		});
	});
});
