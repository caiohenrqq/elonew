import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type WalletFundsReleaseJobSchedulerPort } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createBullmqRedisConnection } from '@packages/config/queue/bullmq-redis.connection';
import type { WalletFundsReleaseJob } from '@packages/shared/wallet/wallet-funds-release-job';
import { Queue } from 'bullmq';

export function createWalletFundsReleaseJobId(input: {
	boosterId: string;
	orderId: string;
}): string {
	return `${input.boosterId}__${input.orderId}`;
}

@Injectable()
export class BullmqWalletFundsReleaseJobSchedulerAdapter
	implements WalletFundsReleaseJobSchedulerPort, OnModuleDestroy
{
	private queue: Queue | null = null;

	constructor(private readonly appSettings: AppSettingsService) {}

	async scheduleRelease(input: {
		orderId: string;
		boosterId: string;
		availableAt: Date;
	}): Promise<void> {
		if (this.appSettings.isTest) return;

		await this.getQueue().add(
			'wallet-funds-release',
			{
				orderId: input.orderId,
				boosterId: input.boosterId,
				availableAt: input.availableAt.toISOString(),
			},
			{
				jobId: createWalletFundsReleaseJobId(input),
				delay: Math.max(input.availableAt.getTime() - Date.now(), 0),
				removeOnComplete: 100,
				removeOnFail: 100,
			},
		);
	}

	async onModuleDestroy(): Promise<void> {
		if (this.queue) await this.queue.close();
	}

	private getQueue(): Queue {
		if (this.queue) return this.queue;

		this.queue = new Queue<WalletFundsReleaseJob>(
			this.appSettings.walletFundsReleaseQueueName,
			{
				connection: createBullmqRedisConnection(this.appSettings.redisUrl),
			},
		);

		return this.queue;
	}
}
