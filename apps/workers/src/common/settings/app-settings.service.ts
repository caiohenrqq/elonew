import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WorkerEnv } from '@packages/config/env/worker-env.schema';

@Injectable()
export class AppSettingsService {
	constructor(
		@Inject(ConfigService)
		private readonly config: ConfigService<WorkerEnv, true>,
	) {}

	get nodeEnv() {
		return this.config.getOrThrow('NODE_ENV', { infer: true });
	}

	get apiInternalBaseUrl() {
		return this.config.getOrThrow('API_INTERNAL_BASE_URL', { infer: true });
	}

	get internalApiKey() {
		return this.config.getOrThrow('INTERNAL_API_KEY', { infer: true });
	}

	get redisUrl() {
		return this.config.getOrThrow('REDIS_URL', { infer: true });
	}

	get walletFundsReleaseQueueName() {
		return this.config.getOrThrow('WALLET_FUNDS_RELEASE_QUEUE_NAME', {
			infer: true,
		});
	}

	get workerConcurrency() {
		return this.config.getOrThrow('WORKER_CONCURRENCY', { infer: true });
	}

	get queuesEnabled() {
		return this.config.getOrThrow('WORKER_QUEUES_ENABLED', { infer: true });
	}

	get scheduledTasksQueueName() {
		return this.config.getOrThrow('SCHEDULED_TASKS_QUEUE_NAME', {
			infer: true,
		});
	}

	get staleCheckoutReconcileCron() {
		return this.config.getOrThrow('STALE_CHECKOUT_RECONCILE_CRON', {
			infer: true,
		});
	}

	get staleCheckoutReconcileLimit() {
		return this.config.getOrThrow('STALE_CHECKOUT_RECONCILE_LIMIT', {
			infer: true,
		});
	}

	get orderQuoteCleanupCron() {
		return this.config.getOrThrow('ORDER_QUOTE_CLEANUP_CRON', { infer: true });
	}

	get orderQuoteCleanupLimit() {
		return this.config.getOrThrow('ORDER_QUOTE_CLEANUP_LIMIT', { infer: true });
	}
}
