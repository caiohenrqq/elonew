import {
	WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY,
	type WalletFundsReleaseExecutorPort,
} from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import { Inject, Injectable } from '@nestjs/common';
import type { WalletFundsReleaseJob } from '@shared/wallet/wallet-funds-release-job';

@Injectable()
export class ProcessWalletFundsReleaseJobUseCase {
	constructor(
		@Inject(WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY)
		private readonly walletFundsReleaseExecutor: WalletFundsReleaseExecutorPort,
	) {}

	async execute(job: WalletFundsReleaseJob): Promise<void> {
		await this.walletFundsReleaseExecutor.execute(job);
	}
}
