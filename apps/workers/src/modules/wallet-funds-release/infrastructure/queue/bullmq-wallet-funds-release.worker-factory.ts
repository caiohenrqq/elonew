import { Injectable } from '@nestjs/common';
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
				connection: this.getRedisConnection(input.redisUrl),
				concurrency: input.concurrency,
			},
		);
	}

	private getRedisConnection(redisUrl: string) {
		const parsed = new URL(redisUrl);

		return {
			host: parsed.hostname,
			port: Number(parsed.port || '6379'),
			username: parsed.username || undefined,
			password: parsed.password || undefined,
			db:
				parsed.pathname && parsed.pathname !== '/'
					? Number(parsed.pathname.slice(1))
					: undefined,
			maxRetriesPerRequest: null,
		};
	}
}
