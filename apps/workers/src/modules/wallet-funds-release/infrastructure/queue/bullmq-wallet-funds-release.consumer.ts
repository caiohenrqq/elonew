import { WorkerLogger } from '@app/common/logging/worker-logger';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	markWalletFundsReleaseLifecycleLogError,
	type WalletFundsReleaseLifecycleLogEvent,
	WalletFundsReleaseLifecycleLogger,
} from '@modules/wallet-funds-release/application/logging/wallet-funds-release-lifecycle.logger';
import { ProcessWalletFundsReleaseJobUseCase } from '@modules/wallet-funds-release/application/use-cases/process-wallet-funds-release-job/process-wallet-funds-release-job.use-case';
import { WalletFundsReleaseInvalidJobError } from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
import {
	BullmqWalletFundsReleaseWorkerFactory,
	type WalletFundsReleaseConsumerInstance,
	type WalletFundsReleaseJobExecution,
} from '@modules/wallet-funds-release/infrastructure/queue/bullmq-wallet-funds-release.worker-factory';
import {
	Inject,
	Injectable,
	OnApplicationBootstrap,
	OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class BullmqWalletFundsReleaseConsumerAdapter
	implements OnApplicationBootstrap, OnApplicationShutdown
{
	private worker: WalletFundsReleaseConsumerInstance | null = null;

	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
		@Inject(ProcessWalletFundsReleaseJobUseCase)
		private readonly processWalletFundsReleaseJobUseCase: ProcessWalletFundsReleaseJobUseCase,
		@Inject(BullmqWalletFundsReleaseWorkerFactory)
		private readonly workerFactory: BullmqWalletFundsReleaseWorkerFactory,
		@Inject(WalletFundsReleaseLifecycleLogger)
		private readonly lifecycleLogger: WalletFundsReleaseLifecycleLogger,
		@Inject(WorkerLogger)
		private readonly logger: WorkerLogger,
	) {}

	onApplicationBootstrap(): void {
		if (!this.appSettings.queuesEnabled) return;

		this.worker = this.workerFactory.create({
			queueName: this.appSettings.walletFundsReleaseQueueName,
			redisUrl: this.appSettings.redisUrl,
			concurrency: this.appSettings.workerConcurrency,
			processJob: async (job) => await this.processJob(job),
		});

		this.logger.info({
			event: 'wallet_funds_release.consumer',
			operation: 'start',
			outcome: 'success',
			queue_name: this.appSettings.walletFundsReleaseQueueName,
			concurrency: this.appSettings.workerConcurrency,
		});
	}

	async onApplicationShutdown(): Promise<void> {
		if (!this.worker) return;
		await this.worker.close();
		this.worker = null;
	}

	// A dropped release leaves money locked with nobody watching, so every
	// attempt emits one event: an invalid payload and an exhausted retry are
	// both queryable.
	async processJob(job: WalletFundsReleaseJobExecution): Promise<void> {
		const startedAt = Date.now();
		const logEvent: WalletFundsReleaseLifecycleLogEvent = {
			event: 'wallet_funds_release.lifecycle',
			operation: 'process_job',
			job_id: job.jobId,
			queue_name: this.appSettings.walletFundsReleaseQueueName,
			attempt: job.attempt,
			booster_id: job.data.boosterId,
			order_id: job.data.orderId,
		};

		try {
			const input = this.mapJobToInput(job.data);
			logEvent.available_at = input.availableAt.toISOString();

			const result =
				await this.processWalletFundsReleaseJobUseCase.execute(input);
			logEvent.outcome = 'success';
			logEvent.api_status = result.apiStatus;
			logEvent.api_request_id = result.apiRequestId;
		} catch (error) {
			markWalletFundsReleaseLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.lifecycleLogger.emit(logEvent, startedAt);
		}
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
