import {
	WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY,
	type WalletFundsReleaseJobSchedulerPort,
} from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { Inject, Injectable } from '@nestjs/common';

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
	) {}

	async execute(input: CreditCompletedOrderEarningsInput): Promise<void> {
		const wallet =
			(await this.walletRepository.findByBoosterId(input.boosterId)) ??
			Wallet.create({ boosterId: input.boosterId });
		const existingCredit = wallet.findOrderCompletionCredit(input.orderId);
		if (existingCredit) {
			await this.walletFundsReleaseJobScheduler.scheduleRelease({
				orderId: input.orderId,
				boosterId: input.boosterId,
				availableAt: existingCredit.availableAt,
			});
			return;
		}

		const availableAt = new Date(
			input.completedAt.getTime() + input.lockPeriodInHours * 60 * 60 * 1000,
		);

		wallet.creditLocked({
			orderId: input.orderId,
			amount: input.amount,
			availableAt,
		});

		await this.walletRepository.save(wallet);
		await this.walletFundsReleaseJobScheduler.scheduleRelease({
			orderId: input.orderId,
			boosterId: input.boosterId,
			availableAt,
		});
	}
}
