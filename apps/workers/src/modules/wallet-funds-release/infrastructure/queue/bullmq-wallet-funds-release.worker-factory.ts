import { Injectable } from '@nestjs/common';
import { createBullmqRedisConnection } from '@packages/config/queue/bullmq-redis.connection';
import type { WalletFundsReleaseJob } from '@packages/shared/wallet/wallet-funds-release-job';
import { Worker } from 'bullmq';

export type WalletFundsReleaseConsumerInstance = {
	close(): Promise<void>;
};

export type WalletFundsReleaseJobExecution = {
	data: WalletFundsReleaseJob;
	jobId: string;
	attempt: number;
};

type CreateBullmqWalletFundsReleaseWorkerInput = {
	queueName: string;
	redisUrl: string;
	concurrency: number;
	processJob(job: WalletFundsReleaseJobExecution): Promise<void>;
};

@Injectable()
export class BullmqWalletFundsReleaseWorkerFactory {
	create(
		input: CreateBullmqWalletFundsReleaseWorkerInput,
	): WalletFundsReleaseConsumerInstance {
		return new Worker<WalletFundsReleaseJob>(
			input.queueName,
			async (job) => {
				await input.processJob({
					data: job.data,
					jobId: job.id ?? 'unknown',
					attempt: job.attemptsMade + 1,
				});
			},
			{
				connection: createBullmqRedisConnection(input.redisUrl),
				concurrency: input.concurrency,
			},
		);
	}
}
