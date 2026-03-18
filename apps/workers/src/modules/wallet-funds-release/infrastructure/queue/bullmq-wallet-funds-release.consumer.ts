import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { ProcessWalletFundsReleaseJobUseCase } from '@modules/wallet-funds-release/application/use-cases/process-wallet-funds-release-job/process-wallet-funds-release-job.use-case';
import { WalletFundsReleaseInvalidJobError } from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
import {
	BullmqWalletFundsReleaseWorkerFactory,
	type WalletFundsReleaseConsumerInstance,
} from '@modules/wallet-funds-release/infrastructure/queue/bullmq-wallet-funds-release.worker-factory';
import {
	Inject,
	Injectable,
	Logger,
	OnApplicationBootstrap,
	OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class BullmqWalletFundsReleaseConsumerAdapter
	implements OnApplicationBootstrap, OnApplicationShutdown
{
	private readonly logger = new Logger(
		BullmqWalletFundsReleaseConsumerAdapter.name,
	);
	private worker: WalletFundsReleaseConsumerInstance | null = null;

	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
		@Inject(ProcessWalletFundsReleaseJobUseCase)
		private readonly processWalletFundsReleaseJobUseCase: ProcessWalletFundsReleaseJobUseCase,
		@Inject(BullmqWalletFundsReleaseWorkerFactory)
		private readonly workerFactory: BullmqWalletFundsReleaseWorkerFactory,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		if (this.appSettings.isTest) return;

		this.worker = this.workerFactory.create({
			queueName: this.appSettings.walletFundsReleaseQueueName,
			redisUrl: this.appSettings.redisUrl,
			concurrency: this.appSettings.workerConcurrency,
			processJob: async (job) => {
				await this.processWalletFundsReleaseJobUseCase.execute(
					this.mapJobToInput(job),
				);
			},
		});

		this.logger.log('Wallet funds release consumer initialized.');
	}

	async onApplicationShutdown(): Promise<void> {
		if (!this.worker) return;
		await this.worker.close();
		this.worker = null;
	}

	private mapJobToInput(job: {
		orderId: string;
		boosterId: string;
		availableAt: string;
	}) {
		const availableAt = new Date(job.availableAt);
		if (Number.isNaN(availableAt.getTime()))
			throw new WalletFundsReleaseInvalidJobError();

		return {
			orderId: job.orderId,
			boosterId: job.boosterId,
			availableAt,
		};
	}
}
