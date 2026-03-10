import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { WalletNotFoundError } from '@modules/wallet/domain/wallet.errors';

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

	insert(wallet: Wallet): void {
		this.wallets.set(wallet.boosterId, wallet);
	}
}

describe('GetWalletUseCase', () => {
	it('returns wallet balances when the wallet exists', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-1' });
		repository.insert(wallet);

		const useCase = new GetWalletUseCase(repository);

		await expect(useCase.execute({ boosterId: 'booster-1' })).resolves.toEqual({
			boosterId: 'booster-1',
			balanceLocked: 0,
			balanceWithdrawable: 0,
		});
	});

	it('throws when the wallet does not exist', async () => {
		const repository = new InMemoryWalletRepository();
		const useCase = new GetWalletUseCase(repository);

		await expect(
			useCase.execute({ boosterId: 'missing-booster' }),
		).rejects.toThrow(WalletNotFoundError);
	});
});
