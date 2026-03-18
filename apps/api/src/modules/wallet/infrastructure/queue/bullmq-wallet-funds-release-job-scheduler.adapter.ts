import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type WalletFundsReleaseJobSchedulerPort } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { WalletFundsReleaseJob } from '@shared/wallet/wallet-funds-release-job';
import { Queue } from 'bullmq';

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
				jobId: `${input.boosterId}:${input.orderId}`,
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
				connection: this.getRedisConnection(),
			},
		);

		return this.queue;
	}

	private getRedisConnection() {
		const parsed = new URL(this.appSettings.redisUrl);

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
