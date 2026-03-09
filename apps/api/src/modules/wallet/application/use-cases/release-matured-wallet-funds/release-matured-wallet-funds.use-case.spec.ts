import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { Wallet } from '@modules/wallet/domain/wallet.entity';

class InMemoryWalletRepository implements WalletRepositoryPort {
	private readonly wallets = new Map<string, Wallet>();

	async findByBoosterId(boosterId: string): Promise<Wallet | null> {
		return this.wallets.get(boosterId) ?? null;
	}

	async save(wallet: Wallet): Promise<void> {
		this.wallets.set(wallet.boosterId, wallet);
	}

	insert(wallet: Wallet): void {
		this.wallets.set(wallet.boosterId, wallet);
	}

	async findAll(): Promise<Wallet[]> {
		return [...this.wallets.values()];
	}
}

describe('ReleaseMaturedWalletFundsUseCase', () => {
	it('releases only matured locked funds into withdrawable balance', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-1' });

		wallet.creditLocked({
			orderId: 'order-matured',
			amount: 70,
			availableAt: new Date('2026-03-10T12:00:00.000Z'),
		});
		wallet.creditLocked({
			orderId: 'order-pending',
			amount: 35,
			availableAt: new Date('2026-03-14T12:00:00.000Z'),
		});
		repository.insert(wallet);

		const useCase = new ReleaseMaturedWalletFundsUseCase(repository);
		await useCase.execute({ now: new Date('2026-03-12T12:00:00.000Z') });

		await expect(
			repository.findByBoosterId('booster-1'),
		).resolves.toMatchObject({
			boosterId: 'booster-1',
			balanceLocked: 35,
			balanceWithdrawable: 70,
			transactions: [
				expect.objectContaining({
					orderId: 'order-matured',
					releasedAt: new Date('2026-03-12T12:00:00.000Z'),
				}),
				expect.objectContaining({
					orderId: 'order-pending',
					releasedAt: null,
				}),
			],
		});
	});

	it('is idempotent when release runs multiple times for the same matured credit', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-2' });

		wallet.creditLocked({
			orderId: 'order-1',
			amount: 70,
			availableAt: new Date('2026-03-10T12:00:00.000Z'),
		});
		repository.insert(wallet);

		const useCase = new ReleaseMaturedWalletFundsUseCase(repository);
		const now = new Date('2026-03-12T12:00:00.000Z');

		await useCase.execute({ now });
		await useCase.execute({ now });

		await expect(
			repository.findByBoosterId('booster-2'),
		).resolves.toMatchObject({
			balanceLocked: 0,
			balanceWithdrawable: 70,
			transactions: [
				expect.objectContaining({
					orderId: 'order-1',
					releasedAt: now,
				}),
			],
		});
	});
});
