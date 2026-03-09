import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
} from '@modules/wallet/domain/wallet.errors';

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

describe('RequestWithdrawalUseCase', () => {
	it('allows withdrawal with no minimum amount when sufficient withdrawable balance exists', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-1' });

		wallet.creditLocked({
			orderId: 'order-1',
			amount: 70,
			availableAt: new Date('2026-03-10T12:00:00.000Z'),
		});
		wallet.releaseMaturedFunds(new Date('2026-03-12T12:00:00.000Z'));
		repository.insert(wallet);

		const useCase = new RequestWithdrawalUseCase(repository);
		await useCase.execute({
			boosterId: 'booster-1',
			amount: 0.01,
			requestedAt: new Date('2026-03-12T13:00:00.000Z'),
		});

		await expect(repository.findByBoosterId('booster-1')).resolves.toEqual(
			expect.objectContaining({
				balanceLocked: 0,
				balanceWithdrawable: 69.99,
				transactions: expect.arrayContaining([
					expect.objectContaining({
						amount: 0.01,
						type: 'debit',
						reason: 'withdrawal_request',
					}),
					expect.objectContaining({
						orderId: 'order-1',
						amount: 70,
						type: 'credit',
						reason: 'order_completion',
					}),
				]),
			}),
		);
	});

	it('rejects withdrawal when amount exceeds withdrawable balance', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-2' });
		repository.insert(wallet);

		const useCase = new RequestWithdrawalUseCase(repository);

		await expect(
			useCase.execute({
				boosterId: 'booster-2',
				amount: 10,
				requestedAt: new Date('2026-03-12T13:00:00.000Z'),
			}),
		).rejects.toThrow(WalletInsufficientWithdrawableBalanceError);
	});

	it('rejects non-positive withdrawal amounts', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-3' });
		repository.insert(wallet);

		const useCase = new RequestWithdrawalUseCase(repository);

		await expect(
			useCase.execute({
				boosterId: 'booster-3',
				amount: 0,
				requestedAt: new Date('2026-03-12T13:00:00.000Z'),
			}),
		).rejects.toThrow(WalletInvalidAmountError);
	});
});
