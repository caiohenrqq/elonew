import {
	markWalletLifecycleLogError,
	type WalletLifecycleLogEvent,
	WalletLifecycleLogger,
} from '@modules/wallet/application/logging/wallet-lifecycle.logger';
import {
	WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY,
	type WalletFundsReleaseJobSchedulerPort,
} from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { Inject, Injectable, Optional } from '@nestjs/common';

type CreditCompletedOrderEarningsInput = {
	orderId: string;
	boosterId: string;
	amount: number;
	completedAt: Date;
	lockPeriodInHours: number;
};

@Injectable()
export class CreditCompletedOrderEarningsUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
		@Inject(WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY)
		private readonly walletFundsReleaseJobScheduler: WalletFundsReleaseJobSchedulerPort,
		@Optional()
		private readonly walletLifecycleLogger?: WalletLifecycleLogger,
	) {}

	async execute(input: CreditCompletedOrderEarningsInput): Promise<void> {
		const startedAt = Date.now();
		const logEvent: WalletLifecycleLogEvent = {
			event: 'wallet.lifecycle',
			operation: 'credit_order_completion',
			booster_id: input.boosterId,
			order_id: input.orderId,
			wallet_amount: input.amount,
			lock_period_hours: input.lockPeriodInHours,
			side_effects: [],
		};

		try {
			const wallet =
				(await this.walletRepository.findByBoosterId(input.boosterId)) ??
				Wallet.create({ boosterId: input.boosterId });
			logEvent.balance_locked_before = wallet.balanceLocked;
			logEvent.balance_withdrawable_before = wallet.balanceWithdrawable;

			const existingCredit = wallet.findOrderCompletionCredit(input.orderId);
			if (existingCredit) {
				logEvent.available_at = existingCredit.availableAt.toISOString();
				await this.walletFundsReleaseJobScheduler.scheduleRelease({
					orderId: input.orderId,
					boosterId: input.boosterId,
					availableAt: existingCredit.availableAt,
				});
				logEvent.side_effects?.push('release_job_scheduled');
				logEvent.outcome = 'skipped';
				logEvent.skipped_reason = 'credit_already_exists';
				logEvent.balance_locked_after = wallet.balanceLocked;
				logEvent.balance_withdrawable_after = wallet.balanceWithdrawable;
				return;
			}

			const availableAt = new Date(
				input.completedAt.getTime() + input.lockPeriodInHours * 60 * 60 * 1000,
			);
			logEvent.available_at = availableAt.toISOString();

			wallet.creditLocked({
				orderId: input.orderId,
				amount: input.amount,
				availableAt,
				createdAt: input.completedAt,
			});

			await this.walletRepository.save(wallet);
			logEvent.side_effects?.push('wallet_credited');
			logEvent.balance_locked_after = wallet.balanceLocked;
			logEvent.balance_withdrawable_after = wallet.balanceWithdrawable;

			await this.walletFundsReleaseJobScheduler.scheduleRelease({
				orderId: input.orderId,
				boosterId: input.boosterId,
				availableAt,
			});
			logEvent.side_effects?.push('release_job_scheduled');
			logEvent.outcome = 'success';
		} catch (error) {
			markWalletLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.walletLifecycleLogger?.emit(logEvent, startedAt);
		}
	}
}
