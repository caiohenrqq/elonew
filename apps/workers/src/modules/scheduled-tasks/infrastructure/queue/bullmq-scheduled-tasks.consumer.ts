import { WorkerLogger } from '@app/common/logging/worker-logger';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	markScheduledTaskLifecycleLogError,
	type ScheduledTaskLifecycleLogEvent,
	ScheduledTaskLifecycleLogger,
} from '@modules/scheduled-tasks/application/logging/scheduled-task-lifecycle.logger';
import { RunScheduledTaskUseCase } from '@modules/scheduled-tasks/application/use-cases/run-scheduled-task/run-scheduled-task.use-case';
import {
	BullmqScheduledTasksQueueFactory,
	type ScheduledTaskJobExecution,
	type ScheduledTasksQueueInstance,
} from '@modules/scheduled-tasks/infrastructure/queue/bullmq-scheduled-tasks.queue-factory';
import {
	Inject,
	Injectable,
	OnApplicationBootstrap,
	OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class BullmqScheduledTasksConsumerAdapter
	implements OnApplicationBootstrap, OnApplicationShutdown
{
	private queue: ScheduledTasksQueueInstance | null = null;

	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
		@Inject(RunScheduledTaskUseCase)
		private readonly runScheduledTask: RunScheduledTaskUseCase,
		@Inject(BullmqScheduledTasksQueueFactory)
		private readonly queueFactory: BullmqScheduledTasksQueueFactory,
		@Inject(ScheduledTaskLifecycleLogger)
		private readonly lifecycleLogger: ScheduledTaskLifecycleLogger,
		@Inject(WorkerLogger)
		private readonly logger: WorkerLogger,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		if (!this.appSettings.queuesEnabled) return;

		this.queue = this.queueFactory.create({
			queueName: this.appSettings.scheduledTasksQueueName,
			redisUrl: this.appSettings.redisUrl,
		});

		const tasks = await this.syncSchedules(this.queue);

		this.queue.startWorker({
			concurrency: this.appSettings.workerConcurrency,
			processJob: async (job) => await this.processJob(job),
		});

		this.logger.info({
			event: 'scheduled_task.consumer',
			operation: 'start',
			outcome: 'success',
			queue_name: this.appSettings.scheduledTasksQueueName,
			tasks: tasks.map((task) => `${task.name}@${task.cron}`),
		});
	}

	async onApplicationShutdown(): Promise<void> {
		if (!this.queue) return;
		await this.queue.close();
		this.queue = null;
	}

	// Redis is made to match the code on every boot: declared tasks are upserted
	// and anything left behind by an older build is removed, so a schedule can
	// never outlive the commit that declared it.
	private async syncSchedules(queue: ScheduledTasksQueueInstance) {
		const tasks = this.runScheduledTask.tasks();

		for (const task of tasks)
			await queue.upsertSchedule({ name: task.name, cron: task.cron });

		const declared = new Set<string>(tasks.map((task) => task.name));
		for (const scheduler of await queue.listSchedules()) {
			if (declared.has(scheduler.name)) continue;

			await queue.removeSchedule(scheduler.name);
			this.logger.info({
				event: 'scheduled_task.consumer',
				operation: 'prune_schedule',
				outcome: 'success',
				queue_name: this.appSettings.scheduledTasksQueueName,
				task_name: scheduler.name,
			});
		}

		return tasks;
	}

	async processJob(job: ScheduledTaskJobExecution): Promise<void> {
		const startedAt = Date.now();
		const taskName = job.data.name;
		const logEvent: ScheduledTaskLifecycleLogEvent = {
			event: 'scheduled_task.lifecycle',
			operation: 'run_task',
			task_name: taskName,
			cron: this.runScheduledTask.tasks().find((task) => task.name === taskName)
				?.cron,
			job_id: job.jobId,
			queue_name: this.appSettings.scheduledTasksQueueName,
			attempt: job.attempt,
		};

		try {
			const result = await this.runScheduledTask.execute(taskName);
			logEvent.outcome = 'success';
			logEvent.api_status = result.apiStatus;
			logEvent.api_request_id = result.apiRequestId;
		} catch (error) {
			markScheduledTaskLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.lifecycleLogger.emit(logEvent, startedAt);
		}
	}
}
