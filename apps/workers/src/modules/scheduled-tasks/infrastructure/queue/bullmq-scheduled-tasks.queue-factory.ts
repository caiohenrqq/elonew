import { Injectable } from '@nestjs/common';
import { createBullmqRedisConnection } from '@packages/config/queue/bullmq-redis.connection';
import { Queue, Worker } from 'bullmq';

// Mirrors WALLET_FUNDS_RELEASE_JOB_OPTIONS: a sweep that fails transiently is
// retried, and a handful of terminal jobs are kept so the admin view and Loki
// can still show what happened.
export const SCHEDULED_TASK_JOB_OPTIONS = {
	attempts: 3,
	backoff: {
		type: 'exponential' as const,
		delay: 10_000,
	},
	removeOnComplete: 50,
	removeOnFail: 50,
};

export type ScheduledTaskJob = { name: string };

export type ScheduledTaskJobExecution = {
	data: ScheduledTaskJob;
	jobId: string;
	attempt: number;
};

export type ScheduledTaskSchedulerState = {
	name: string;
	cron: string | null;
	nextRunAt: Date | null;
};

// Wraps the two BullMQ objects the consumer needs so the scheduling logic stays
// testable without Redis.
export type ScheduledTasksQueueInstance = {
	upsertSchedule(input: { name: string; cron: string }): Promise<void>;
	listSchedules(): Promise<ScheduledTaskSchedulerState[]>;
	removeSchedule(name: string): Promise<void>;
	startWorker(input: {
		concurrency: number;
		processJob(job: ScheduledTaskJobExecution): Promise<void>;
	}): void;
	close(): Promise<void>;
};

@Injectable()
export class BullmqScheduledTasksQueueFactory {
	create(input: {
		queueName: string;
		redisUrl: string;
	}): ScheduledTasksQueueInstance {
		const queue = new Queue<ScheduledTaskJob>(input.queueName, {
			connection: createBullmqRedisConnection(input.redisUrl),
		});
		let worker: Worker<ScheduledTaskJob> | null = null;

		return {
			upsertSchedule: async ({ name, cron }) => {
				await queue.upsertJobScheduler(
					name,
					{ pattern: cron },
					{ name, data: { name }, opts: SCHEDULED_TASK_JOB_OPTIONS },
				);
			},
			listSchedules: async () => {
				const schedulers = await queue.getJobSchedulers();

				return schedulers.map((scheduler) => ({
					name: String(scheduler.key ?? scheduler.name ?? ''),
					cron: scheduler.pattern ?? null,
					nextRunAt: scheduler.next ? new Date(scheduler.next) : null,
				}));
			},
			removeSchedule: async (name) => {
				await queue.removeJobScheduler(name);
			},
			startWorker: ({ concurrency, processJob }) => {
				worker = new Worker<ScheduledTaskJob>(
					input.queueName,
					async (job) => {
						await processJob({
							data: job.data,
							jobId: job.id ?? 'unknown',
							attempt: job.attemptsMade + 1,
						});
					},
					{
						connection: createBullmqRedisConnection(input.redisUrl),
						concurrency,
					},
				);
			},
			close: async () => {
				if (worker) await worker.close();
				await queue.close();
			},
		};
	}
}
