import {
	markWalletLifecycleLogError,
	type WalletLifecycleLogEvent,
	WalletLifecycleLogger,
} from '@modules/wallet/application/logging/wallet-lifecycle.logger';
import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Inject, Injectable, Optional } from '@nestjs/common';

type ReleaseMaturedWalletFundsInput = {
	boosterId: string;
	orderId: string;
	now: Date;
};

export type ReleaseMaturedWalletFundsOutput = {
	outcome: 'released' | 'skipped';
	releasedAmount: number;
	skippedReason?:
		| 'wallet_not_found'
		| 'credit_not_found'
		| 'already_released'
		| 'not_matured';
};

// The scheduled job may run more than once for the same credit, so an already
// released credit is a skip, never a failure: throwing here would make BullMQ
// retry and then drop a job that had nothing left to do.
@Injectable()
export class ReleaseMaturedWalletFundsUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
		@Optional()
		private readonly walletLifecycleLogger?: WalletLifecycleLogger,
	) {}

	async execute(
		input: ReleaseMaturedWalletFundsInput,
	): Promise<ReleaseMaturedWalletFundsOutput> {
		const startedAt = Date.now();
		const logEvent: WalletLifecycleLogEvent = {
			event: 'wallet.lifecycle',
			operation: 'release_order_completion',
			booster_id: input.boosterId,
			order_id: input.orderId,
			release_source: 'schedule',
			side_effects: [],
		};

		try {
			const wallet = await this.walletRepository.findByBoosterId(
				input.boosterId,
			);
			if (!wallet) {
				logEvent.outcome = 'skipped';
				logEvent.skipped_reason = 'wallet_not_found';
				return {
					outcome: 'skipped',
					releasedAmount: 0,
					skippedReason: 'wallet_not_found',
				};
			}

			logEvent.balance_locked_before = wallet.balanceLocked;
			logEvent.balance_withdrawable_before = wallet.balanceWithdrawable;

			const credit = wallet.findOrderCompletionCredit(input.orderId);
			if (!credit) {
				logEvent.outcome = 'skipped';
				logEvent.skipped_reason = 'credit_not_found';
				return {
					outcome: 'skipped',
					releasedAmount: 0,
					skippedReason: 'credit_not_found',
				};
			}

			logEvent.wallet_amount = credit.amount;
			logEvent.available_at = credit.availableAt.toISOString();

			const { releasedAmount, releasedCount } =
				wallet.releaseOrderCompletionFunds({
					orderId: input.orderId,
					now: input.now,
				});

			if (releasedCount === 0) {
				const skippedReason = credit.releasedAt
					? 'already_released'
					: 'not_matured';
				logEvent.outcome = 'skipped';
				logEvent.skipped_reason = skippedReason;
				return { outcome: 'skipped', releasedAmount: 0, skippedReason };
			}

			await this.walletRepository.save(wallet);
			logEvent.side_effects?.push('funds_released');
			logEvent.outcome = 'success';
			logEvent.released_amount = releasedAmount;
			logEvent.released_transaction_count = releasedCount;
			logEvent.balance_locked_after = wallet.balanceLocked;
			logEvent.balance_withdrawable_after = wallet.balanceWithdrawable;

			return { outcome: 'released', releasedAmount };
		} catch (error) {
			markWalletLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.walletLifecycleLogger?.emit(logEvent, startedAt);
		}
	}
}
