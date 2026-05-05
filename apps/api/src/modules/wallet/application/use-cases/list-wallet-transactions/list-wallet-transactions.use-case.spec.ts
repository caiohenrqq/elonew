import type {
	WalletTransactionReaderPort,
	WalletTransactionSnapshot,
} from '@modules/wallet/application/ports/wallet-transaction-reader.port';
import { ListWalletTransactionsUseCase } from '@modules/wallet/application/use-cases/list-wallet-transactions/list-wallet-transactions.use-case';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { WalletNotFoundError } from '@modules/wallet/domain/wallet.errors';

class InMemoryWalletTransactionReader implements WalletTransactionReaderPort {
	private readonly wallets = new Map<string, Wallet>();

	async findRecentForBooster(
		boosterId: string,
		limit: number,
	): Promise<WalletTransactionSnapshot[] | null> {
		const wallet = this.wallets.get(boosterId);
		if (!wallet) return null;
		return [...wallet.transactions]
			.sort(
				(left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
			)
			.slice(0, limit)
			.map((transaction, index) => ({
				...transaction,
				id: `${transaction.reason}:${transaction.orderId ?? 'wallet'}:${transaction.createdAt.toISOString()}:${index}`,
			}));
	}

	insert(wallet: Wallet): void {
		this.wallets.set(wallet.boosterId, wallet);
	}
}

describe('ListWalletTransactionsUseCase', () => {
	it('returns recent wallet transactions newest first', async () => {
		const wallet = Wallet.create({ boosterId: 'booster-1' });
		wallet.creditLocked({
			orderId: 'order-1',
			amount: 70,
			availableAt: new Date('2026-05-01T10:00:00.000Z'),
		});
		wallet.releaseMaturedFunds(new Date('2026-05-02T10:00:00.000Z'));
		wallet.withdraw({
			amount: 40,
			requestedAt: new Date('2026-05-03T10:00:00.000Z'),
		});
		const reader = new InMemoryWalletTransactionReader();
		reader.insert(wallet);
		const useCase = new ListWalletTransactionsUseCase(reader);

		await expect(
			useCase.execute({ boosterId: 'booster-1', limit: 10 }),
		).resolves.toEqual({
			transactions: [
				expect.objectContaining({
					type: 'debit',
					reason: 'withdrawal_request',
					amount: 40,
				}),
				expect.objectContaining({
					type: 'credit',
					reason: 'order_completion',
					amount: 70,
					orderId: 'order-1',
				}),
			],
		});
	});

	it('caps the transaction limit', async () => {
		const wallet = Wallet.create({ boosterId: 'booster-1' });
		for (let index = 0; index < 80; index += 1) {
			wallet.creditLocked({
				orderId: `order-${index + 1}`,
				amount: 10,
				availableAt: new Date(
					`2026-05-01T10:${String(index % 60).padStart(2, '0')}:00.000Z`,
				),
			});
		}
		const reader = new InMemoryWalletTransactionReader();
		reader.insert(wallet);
		const useCase = new ListWalletTransactionsUseCase(reader);

		const result = await useCase.execute({
			boosterId: 'booster-1',
			limit: 500,
		});

		expect(result.transactions).toHaveLength(50);
	});

	it('throws when the wallet does not exist', async () => {
		const useCase = new ListWalletTransactionsUseCase(
			new InMemoryWalletTransactionReader(),
		);

		await expect(
			useCase.execute({ boosterId: 'missing-booster' }),
		).rejects.toThrow(WalletNotFoundError);
	});
});
