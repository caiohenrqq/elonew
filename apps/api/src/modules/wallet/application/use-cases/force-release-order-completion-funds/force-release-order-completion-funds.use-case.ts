import {
	markWalletLifecycleLogError,
	type WalletLifecycleLogEvent,
	WalletLifecycleLogger,
} from '@modules/wallet/application/logging/wallet-lifecycle.logger';
import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import {
	WalletNotFoundError,
	WalletOrderCompletionAlreadyReleasedError,
	WalletOrderCompletionCreditNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import { Inject, Injectable, Optional } from '@nestjs/common';

type ForceReleaseOrderCompletionFundsInput = {
	boosterId: string;
	orderId: string;
	adminUserId: string;
	now: Date;
};

export type ForceReleaseOrderCompletionFundsOutput = {
	releasedAmount: number;
	balanceWithdrawable: number;
};

// Unlike the scheduled release, an admin acting on nothing is a real mistake:
// every no-op turns into an error the operator can read.
@Injectable()
export class ForceReleaseOrderCompletionFundsUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
		@Optional()
		private readonly walletLifecycleLogger?: WalletLifecycleLogger,
	) {}

	async execute(
		input: ForceReleaseOrderCompletionFundsInput,
	): Promise<ForceReleaseOrderCompletionFundsOutput> {
		const startedAt = Date.now();
		const logEvent: WalletLifecycleLogEvent = {
			event: 'wallet.lifecycle',
			operation: 'admin_force_release',
			booster_id: input.boosterId,
			order_id: input.orderId,
			admin_user_id: input.adminUserId,
			release_source: 'admin',
			side_effects: [],
		};

		try {
			const wallet = await this.walletRepository.findByBoosterId(
				input.boosterId,
			);
			if (!wallet) throw new WalletNotFoundError();

			logEvent.balance_locked_before = wallet.balanceLocked;
			logEvent.balance_withdrawable_before = wallet.balanceWithdrawable;

			const credit = wallet.findOrderCompletionCredit(input.orderId);
			if (!credit) throw new WalletOrderCompletionCreditNotFoundError();

			logEvent.wallet_amount = credit.amount;
			logEvent.available_at = credit.availableAt.toISOString();
			if (credit.releasedAt)
				throw new WalletOrderCompletionAlreadyReleasedError();

			const { releasedAmount, releasedCount } =
				wallet.forceReleaseOrderCompletionFunds({
					orderId: input.orderId,
					now: input.now,
				});

			await this.walletRepository.save(wallet);
			logEvent.side_effects?.push('funds_released');
			logEvent.outcome = 'success';
			logEvent.released_amount = releasedAmount;
			logEvent.released_transaction_count = releasedCount;
			logEvent.balance_locked_after = wallet.balanceLocked;
			logEvent.balance_withdrawable_after = wallet.balanceWithdrawable;

			return {
				releasedAmount,
				balanceWithdrawable: wallet.balanceWithdrawable,
			};
		} catch (error) {
			markWalletLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.walletLifecycleLogger?.emit(logEvent, startedAt);
		}
	}
}
