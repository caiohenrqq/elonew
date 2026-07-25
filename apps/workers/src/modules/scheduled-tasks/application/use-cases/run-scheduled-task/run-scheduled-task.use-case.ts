import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	SCHEDULED_TASK_EXECUTOR_PORT_KEY,
	type ScheduledTaskExecutionResult,
	type ScheduledTaskExecutorPort,
} from '@modules/scheduled-tasks/application/ports/scheduled-task-executor.port';
import { UnknownScheduledTaskError } from '@modules/scheduled-tasks/domain/scheduled-tasks.errors';
import {
	buildScheduledTasks,
	type ScheduledTask,
} from '@modules/scheduled-tasks/domain/scheduled-tasks.registry';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RunScheduledTaskUseCase {
	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
		@Inject(SCHEDULED_TASK_EXECUTOR_PORT_KEY)
		private readonly executor: ScheduledTaskExecutorPort,
	) {}

	tasks(): ScheduledTask[] {
		return buildScheduledTasks(this.appSettings);
	}

	async execute(taskName: string): Promise<ScheduledTaskExecutionResult> {
		const task = this.tasks().find((candidate) => candidate.name === taskName);
		if (!task) throw new UnknownScheduledTaskError(taskName);

		return await this.executor.execute(task);
	}
}
