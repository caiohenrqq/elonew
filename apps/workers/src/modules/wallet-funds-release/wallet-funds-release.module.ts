import { WorkerLogger } from '@app/common/logging/worker-logger';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { WalletFundsReleaseLifecycleLogger } from '@modules/wallet-funds-release/application/logging/wallet-funds-release-lifecycle.logger';
import { WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY } from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import { ProcessWalletFundsReleaseJobUseCase } from '@modules/wallet-funds-release/application/use-cases/process-wallet-funds-release-job/process-wallet-funds-release-job.use-case';
import { InternalApiWalletFundsReleaseExecutorAdapter } from '@modules/wallet-funds-release/infrastructure/http/internal-api-wallet-funds-release.executor';
import { BullmqWalletFundsReleaseConsumerAdapter } from '@modules/wallet-funds-release/infrastructure/queue/bullmq-wallet-funds-release.consumer';
import { BullmqWalletFundsReleaseWorkerFactory } from '@modules/wallet-funds-release/infrastructure/queue/bullmq-wallet-funds-release.worker-factory';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule],
	providers: [
		WorkerLogger,
		WalletFundsReleaseLifecycleLogger,
		InternalApiWalletFundsReleaseExecutorAdapter,
		BullmqWalletFundsReleaseConsumerAdapter,
		BullmqWalletFundsReleaseWorkerFactory,
		{
			provide: WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY,
			useExisting: InternalApiWalletFundsReleaseExecutorAdapter,
		},
		ProcessWalletFundsReleaseJobUseCase,
	],
})
export class WalletFundsReleaseModule {}
