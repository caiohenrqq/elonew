import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type {
	ScheduledJobQueueSnapshot,
	ScheduledJobsReaderPort,
} from '@modules/admin/application/ports/scheduled-jobs-reader.port';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createBullmqRedisConnection } from '@packages/config/queue/bullmq-redis.connection';
import { Queue } from 'bullmq';

const PENDING_JOBS_LIMIT = 10;

@Injectable()
export class BullmqScheduledJobsReader
	implements ScheduledJobsReaderPort, OnModuleDestroy
{
	private readonly queues = new Map<string, Queue>();

	constructor(private readonly appSettings: AppSettingsService) {}

	async readQueues(queueNames: string[]): Promise<ScheduledJobQueueSnapshot[]> {
		return await Promise.all(
			queueNames.map(async (queueName) => {
				const queue = this.getQueue(queueName);
				const [counts, schedulers, delayed] = await Promise.all([
					queue.getJobCounts(
						'delayed',
						'waiting',
						'active',
						'failed',
						'completed',
					),
					queue.getJobSchedulers(),
					queue.getDelayed(0, PENDING_JOBS_LIMIT - 1),
				]);

				return {
					queueName,
					counts: {
						delayed: counts.delayed ?? 0,
						waiting: counts.waiting ?? 0,
						active: counts.active ?? 0,
						failed: counts.failed ?? 0,
						completed: counts.completed ?? 0,
					},
					schedulers: schedulers.map((scheduler) => ({
						name: String(scheduler.key ?? scheduler.name ?? ''),
						cron: scheduler.pattern ?? null,
						nextRunAt: scheduler.next ? new Date(scheduler.next) : null,
					})),
					pending: delayed.map((job) => ({
						id: String(job.id ?? ''),
						name: job.name,
						// A delayed job's due time is its creation stamp plus the delay it
						// was queued with; both are needed to spot an overdue release.
						dueAt: job.timestamp
							? new Date(job.timestamp + Number(job.opts.delay ?? 0))
							: null,
					})),
				};
			}),
		);
	}

	async onModuleDestroy(): Promise<void> {
		await Promise.all([...this.queues.values()].map((queue) => queue.close()));
		this.queues.clear();
	}

	private getQueue(queueName: string): Queue {
		const existing = this.queues.get(queueName);
		if (existing) return existing;

		const queue = new Queue(queueName, {
			connection: createBullmqRedisConnection(this.appSettings.redisUrl),
		});
		this.queues.set(queueName, queue);

		return queue;
	}
}
