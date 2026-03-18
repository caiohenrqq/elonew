import { Injectable } from '@nestjs/common';
import { createBullmqRedisConnection } from '@packages/config/queue/bullmq-redis.connection';
import type { WalletFundsReleaseJob } from '@shared/wallet/wallet-funds-release-job';
import { Worker } from 'bullmq';

export type WalletFundsReleaseConsumerInstance = {
	close(): Promise<void>;
};

type CreateBullmqWalletFundsReleaseWorkerInput = {
	queueName: string;
	redisUrl: string;
	concurrency: number;
	processJob(job: WalletFundsReleaseJob): Promise<void>;
};

@Injectable()
export class BullmqWalletFundsReleaseWorkerFactory {
	create(
		input: CreateBullmqWalletFundsReleaseWorkerInput,
	): WalletFundsReleaseConsumerInstance {
		return new Worker<WalletFundsReleaseJob>(
			input.queueName,
			async (job) => {
				await input.processJob(job.data);
			},
			{
				connection: createBullmqRedisConnection(input.redisUrl),
				concurrency: input.concurrency,
			},
		);
	}
}
