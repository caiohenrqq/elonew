import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	Inject,
	Injectable,
	Logger,
	OnApplicationBootstrap,
	OnApplicationShutdown,
} from '@nestjs/common';
import type { OutboxEventRecord } from './outbox-event';
import { OutboxHandlerRegistry } from './outbox-event-handler';
import { OUTBOX_STORE, type OutboxStore } from './outbox-store';

const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 10;
const RETRY_BACKOFF_MS = 5000;

@Injectable()
export class OutboxDispatcherService
	implements OnApplicationBootstrap, OnApplicationShutdown
{
	private readonly logger = new Logger(OutboxDispatcherService.name);
	private timer: NodeJS.Timeout | null = null;
	private running = false;

	constructor(
		@Inject(OUTBOX_STORE)
		private readonly store: OutboxStore,
		private readonly registry: OutboxHandlerRegistry,
		private readonly appSettings: AppSettingsService,
	) {}

	onApplicationBootstrap(): void {
		if (this.appSettings.isTest) return;

		this.timer = setInterval(() => {
			void this.processPendingBatch();
		}, POLL_INTERVAL_MS);
		this.timer.unref();
		this.logger.log('Outbox dispatcher initialized.');
	}

	onApplicationShutdown(): void {
		if (!this.timer) return;
		clearInterval(this.timer);
		this.timer = null;
	}

	async processPendingBatch(now: Date = new Date()): Promise<void> {
		if (this.running) return;
		this.running = true;
		try {
			const events = await this.store.fetchPending(now, BATCH_SIZE);
			for (const event of events) await this.dispatch(event, now);
		} finally {
			this.running = false;
		}
	}

	private async dispatch(event: OutboxEventRecord, now: Date): Promise<void> {
		const handler = this.registry.resolve(event.eventType);
		if (!handler) {
			await this.store.markFailed({
				id: event.id,
				attempts: event.attempts + 1,
				lastError: `No handler registered for event type "${event.eventType}".`,
			});
			this.logger.error(
				`Outbox event ${event.id} has no handler for "${event.eventType}".`,
			);
			return;
		}

		try {
			await handler.handle(event);
			await this.store.markPublished(event.id, now);
		} catch (error) {
			await this.handleFailure(event, now, this.getErrorMessage(error));
		}
	}

	private async handleFailure(
		event: OutboxEventRecord,
		now: Date,
		message: string,
	): Promise<void> {
		const attempts = event.attempts + 1;
		if (attempts >= MAX_ATTEMPTS) {
			await this.store.markFailed({
				id: event.id,
				attempts,
				lastError: message,
			});
			this.logger.error(
				`Outbox event ${event.id} exhausted retries: ${message}`,
			);
			return;
		}

		await this.store.markRetry({
			id: event.id,
			attempts,
			availableAt: new Date(now.getTime() + RETRY_BACKOFF_MS * attempts),
			lastError: message,
		});
		this.logger.warn(
			`Outbox event ${event.id} failed (attempt ${attempts}): ${message}`,
		);
	}

	private getErrorMessage(error: unknown): string {
		return error instanceof Error ? error.message : String(error);
	}
}
