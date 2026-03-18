import {
	WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY,
	type WalletFundsReleaseExecutorPort,
} from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import type { ProcessWalletFundsReleaseJobInput } from '@modules/wallet-funds-release/application/process-wallet-funds-release-job.input';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ProcessWalletFundsReleaseJobUseCase {
	constructor(
		@Inject(WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY)
		private readonly walletFundsReleaseExecutor: WalletFundsReleaseExecutorPort,
	) {}

	async execute(job: ProcessWalletFundsReleaseJobInput): Promise<void> {
		await this.walletFundsReleaseExecutor.execute(job);
	}
}
