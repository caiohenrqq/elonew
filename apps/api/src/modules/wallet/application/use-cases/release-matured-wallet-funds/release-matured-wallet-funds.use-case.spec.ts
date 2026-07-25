import type {
	WalletLifecycleLogEvent,
	WalletLifecycleLogger,
} from '@modules/wallet/application/logging/wallet-lifecycle.logger';
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

class WalletLifecycleLoggerSpy {
	readonly events: WalletLifecycleLogEvent[] = [];

	emit(event: WalletLifecycleLogEvent): void {
		this.events.push(event);
	}
}

const createUseCase = (repository: WalletRepositoryPort) => {
	const logger = new WalletLifecycleLoggerSpy();
	const useCase = new ReleaseMaturedWalletFundsUseCase(
		repository,
		logger as unknown as WalletLifecycleLogger,
	);

	return { useCase, logger };
};

const creditOrder = (
	wallet: Wallet,
	orderId: string,
	amount: number,
	availableAt: string,
) => {
	wallet.creditLocked({
		orderId,
		amount,
		availableAt: new Date(availableAt),
		createdAt: new Date('2026-03-09T12:00:00.000Z'),
	});
};

describe('ReleaseMaturedWalletFundsUseCase', () => {
	it('releases only the targeted matured locked funds into withdrawable balance', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-1' });

		creditOrder(wallet, 'order-matured', 70, '2026-03-10T12:00:00.000Z');
		creditOrder(wallet, 'order-other-matured', 20, '2026-03-11T12:00:00.000Z');
		creditOrder(wallet, 'order-pending', 35, '2026-03-14T12:00:00.000Z');
		repository.insert(wallet);

		const { useCase, logger } = createUseCase(repository);
		await expect(
			useCase.execute({
				boosterId: 'booster-1',
				orderId: 'order-matured',
				now: new Date('2026-03-12T12:00:00.000Z'),
			}),
		).resolves.toEqual({ outcome: 'released', releasedAmount: 70 });

		await expect(
			repository.findByBoosterId('booster-1'),
		).resolves.toMatchObject({
			boosterId: 'booster-1',
			balanceLocked: 55,
			balanceWithdrawable: 70,
			transactions: [
				expect.objectContaining({
					orderId: 'order-matured',
					releasedAt: new Date('2026-03-12T12:00:00.000Z'),
					releasedBy: 'schedule',
				}),
				expect.objectContaining({
					orderId: 'order-other-matured',
					releasedAt: null,
					releasedBy: null,
				}),
				expect.objectContaining({
					orderId: 'order-pending',
					releasedAt: null,
					releasedBy: null,
				}),
			],
		});

		expect(logger.events).toHaveLength(1);
		expect(logger.events[0]).toMatchObject({
			event: 'wallet.lifecycle',
			operation: 'release_order_completion',
			outcome: 'success',
			booster_id: 'booster-1',
			order_id: 'order-matured',
			release_source: 'schedule',
			released_amount: 70,
			released_transaction_count: 1,
			balance_locked_before: 125,
			balance_locked_after: 55,
			balance_withdrawable_before: 0,
			balance_withdrawable_after: 70,
			side_effects: ['funds_released'],
		});
	});

	it('is idempotent when release runs multiple times for the same targeted credit', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-2' });

		creditOrder(wallet, 'order-1', 70, '2026-03-10T12:00:00.000Z');
		repository.insert(wallet);

		const { useCase, logger } = createUseCase(repository);
		const now = new Date('2026-03-12T12:00:00.000Z');

		await useCase.execute({ boosterId: 'booster-2', orderId: 'order-1', now });
		await expect(
			useCase.execute({ boosterId: 'booster-2', orderId: 'order-1', now }),
		).resolves.toEqual({
			outcome: 'skipped',
			releasedAmount: 0,
			skippedReason: 'already_released',
		});

		await expect(
			repository.findByBoosterId('booster-2'),
		).resolves.toMatchObject({
			balanceLocked: 0,
			balanceWithdrawable: 70,
			transactions: [
				expect.objectContaining({ orderId: 'order-1', releasedAt: now }),
			],
		});

		expect(logger.events.map((event) => event.outcome)).toEqual([
			'success',
			'skipped',
		]);
	});

	it('reports an immature credit as skipped without touching balances', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-3' });

		creditOrder(wallet, 'order-1', 70, '2026-03-20T12:00:00.000Z');
		repository.insert(wallet);

		const { useCase, logger } = createUseCase(repository);
		await expect(
			useCase.execute({
				boosterId: 'booster-3',
				orderId: 'order-1',
				now: new Date('2026-03-12T12:00:00.000Z'),
			}),
		).resolves.toEqual({
			outcome: 'skipped',
			releasedAmount: 0,
			skippedReason: 'not_matured',
		});

		await expect(
			repository.findByBoosterId('booster-3'),
		).resolves.toMatchObject({ balanceLocked: 70, balanceWithdrawable: 0 });
		expect(logger.events[0]).toMatchObject({
			outcome: 'skipped',
			skipped_reason: 'not_matured',
		});
	});

	it('reports a missing wallet and a missing credit as distinct skips', async () => {
		const repository = new InMemoryWalletRepository();
		const wallet = Wallet.create({ boosterId: 'booster-4' });
		creditOrder(wallet, 'order-1', 70, '2026-03-10T12:00:00.000Z');
		repository.insert(wallet);

		const { useCase, logger } = createUseCase(repository);

		await expect(
			useCase.execute({
				boosterId: 'ghost-booster',
				orderId: 'order-1',
				now: new Date('2026-03-12T12:00:00.000Z'),
			}),
		).resolves.toMatchObject({ skippedReason: 'wallet_not_found' });
		await expect(
			useCase.execute({
				boosterId: 'booster-4',
				orderId: 'ghost-order',
				now: new Date('2026-03-12T12:00:00.000Z'),
			}),
		).resolves.toMatchObject({ skippedReason: 'credit_not_found' });

		expect(logger.events.map((event) => event.skipped_reason)).toEqual([
			'wallet_not_found',
			'credit_not_found',
		]);
	});
});
