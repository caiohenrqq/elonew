import { WorkerLogger } from '@app/common/logging/worker-logger';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { ScheduledTaskLifecycleLogger } from '@modules/scheduled-tasks/application/logging/scheduled-task-lifecycle.logger';
import { SCHEDULED_TASK_EXECUTOR_PORT_KEY } from '@modules/scheduled-tasks/application/ports/scheduled-task-executor.port';
import { RunScheduledTaskUseCase } from '@modules/scheduled-tasks/application/use-cases/run-scheduled-task/run-scheduled-task.use-case';
import { InternalApiScheduledTaskExecutorAdapter } from '@modules/scheduled-tasks/infrastructure/http/internal-api-scheduled-task.executor';
import { BullmqScheduledTasksConsumerAdapter } from '@modules/scheduled-tasks/infrastructure/queue/bullmq-scheduled-tasks.consumer';
import { BullmqScheduledTasksQueueFactory } from '@modules/scheduled-tasks/infrastructure/queue/bullmq-scheduled-tasks.queue-factory';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule],
	providers: [
		WorkerLogger,
		ScheduledTaskLifecycleLogger,
		InternalApiScheduledTaskExecutorAdapter,
		{
			provide: SCHEDULED_TASK_EXECUTOR_PORT_KEY,
			useExisting: InternalApiScheduledTaskExecutorAdapter,
		},
		RunScheduledTaskUseCase,
		BullmqScheduledTasksQueueFactory,
		BullmqScheduledTasksConsumerAdapter,
	],
})
export class ScheduledTasksModule {}
