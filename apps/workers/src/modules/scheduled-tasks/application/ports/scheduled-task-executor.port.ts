import type { ScheduledTask } from '@modules/scheduled-tasks/domain/scheduled-tasks.registry';

export const SCHEDULED_TASK_EXECUTOR_PORT_KEY = Symbol(
	'SCHEDULED_TASK_EXECUTOR_PORT_KEY',
);

export type ScheduledTaskExecutionResult = {
	apiStatus: number;
	apiRequestId: string;
};

export interface ScheduledTaskExecutorPort {
	execute(task: ScheduledTask): Promise<ScheduledTaskExecutionResult>;
}
