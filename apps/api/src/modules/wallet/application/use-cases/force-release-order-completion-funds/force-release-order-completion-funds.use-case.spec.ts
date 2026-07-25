import type {
	WalletLifecycleLogEvent,
	WalletLifecycleLogger,
} from '@modules/wallet/application/logging/wallet-lifecycle.logger';
import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import { ForceReleaseOrderCompletionFundsUseCase } from '@modules/wallet/application/use-cases/force-release-order-completion-funds/force-release-order-completion-funds.use-case';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import {
	WalletNotFoundError,
	WalletOrderCompletionAlreadyReleasedError,
	WalletOrderCompletionCreditNotFoundError,
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

class WalletLifecycleLoggerSpy {
	readonly events: WalletLifecycleLogEvent[] = [];

	emit(event: WalletLifecycleLogEvent): void {
		this.events.push(event);
	}
}

const now = new Date('2026-07-25T12:00:00.000Z');

const createScenario = () => {
	const repository = new InMemoryWalletRepository();
	const logger = new WalletLifecycleLoggerSpy();
	const useCase = new ForceReleaseOrderCompletionFundsUseCase(
		repository,
		logger as unknown as WalletLifecycleLogger,
	);

	return { repository, logger, useCase };
};

const walletWithLockedCredit = () => {
	const wallet = Wallet.create({ boosterId: 'booster-1' });
	wallet.creditLocked({
		orderId: 'order-1',
		amount: 4000,
		// Still inside the lock window at `now`.
		availableAt: new Date('2026-07-28T12:00:00.000Z'),
		createdAt: new Date('2026-07-25T11:00:00.000Z'),
	});

	return wallet;
};

describe('ForceReleaseOrderCompletionFundsUseCase', () => {
	it('releases funds that the schedule would still be holding', async () => {
		const { repository, logger, useCase } = createScenario();
		repository.insert(walletWithLockedCredit());

		await expect(
			useCase.execute({
				boosterId: 'booster-1',
				orderId: 'order-1',
				adminUserId: 'admin-1',
				now,
			}),
		).resolves.toEqual({ releasedAmount: 4000, balanceWithdrawable: 4000 });

		await expect(
			repository.findByBoosterId('booster-1'),
		).resolves.toMatchObject({
			balanceLocked: 0,
			balanceWithdrawable: 4000,
			transactions: [
				expect.objectContaining({ releasedAt: now, releasedBy: 'admin' }),
			],
		});
		expect(logger.events).toHaveLength(1);
		expect(logger.events[0]).toMatchObject({
			event: 'wallet.lifecycle',
			operation: 'admin_force_release',
			outcome: 'success',
			admin_user_id: 'admin-1',
			booster_id: 'booster-1',
			order_id: 'order-1',
			release_source: 'admin',
			released_amount: 4000,
			released_transaction_count: 1,
			balance_locked_before: 4000,
			balance_locked_after: 0,
			balance_withdrawable_after: 4000,
			side_effects: ['funds_released'],
		});
	});

	it('fails when the booster has no wallet', async () => {
		const { useCase, logger } = createScenario();

		await expect(
			useCase.execute({
				boosterId: 'ghost',
				orderId: 'order-1',
				adminUserId: 'admin-1',
				now,
			}),
		).rejects.toThrow(WalletNotFoundError);
		expect(logger.events[0]).toMatchObject({
			outcome: 'error',
			error_type: 'WalletNotFoundError',
		});
	});

	it('fails when the order has no completion credit', async () => {
		const { repository, useCase, logger } = createScenario();
		repository.insert(walletWithLockedCredit());

		await expect(
			useCase.execute({
				boosterId: 'booster-1',
				orderId: 'other-order',
				adminUserId: 'admin-1',
				now,
			}),
		).rejects.toThrow(WalletOrderCompletionCreditNotFoundError);
		expect(logger.events[0]).toMatchObject({
			outcome: 'error',
			error_type: 'WalletOrderCompletionCreditNotFoundError',
		});
	});

	it('fails instead of double paying an already released credit', async () => {
		const { repository, useCase, logger } = createScenario();
		const wallet = walletWithLockedCredit();
		wallet.forceReleaseOrderCompletionFunds({ orderId: 'order-1', now });
		repository.insert(wallet);

		await expect(
			useCase.execute({
				boosterId: 'booster-1',
				orderId: 'order-1',
				adminUserId: 'admin-1',
				now,
			}),
		).rejects.toThrow(WalletOrderCompletionAlreadyReleasedError);
		await expect(
			repository.findByBoosterId('booster-1'),
		).resolves.toMatchObject({ balanceWithdrawable: 4000 });
		expect(logger.events[0]).toMatchObject({
			outcome: 'error',
			error_type: 'WalletOrderCompletionAlreadyReleasedError',
			wallet_amount: 4000,
		});
	});
});
