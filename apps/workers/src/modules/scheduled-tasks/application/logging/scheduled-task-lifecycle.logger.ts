import { WorkerLogger } from '@app/common/logging/worker-logger';
import { ScheduledTaskExecutionFailedError } from '@modules/scheduled-tasks/domain/scheduled-tasks.errors';
import { Inject, Injectable } from '@nestjs/common';

export type ScheduledTaskLifecycleLogEvent = {
	event: 'scheduled_task.lifecycle';
	operation: 'run_task';
	outcome?: 'success' | 'error';
	duration_ms?: number;
	task_name?: string;
	cron?: string;
	job_id?: string;
	queue_name?: string;
	attempt?: number;
	api_status?: number;
	api_request_id?: string;
	error_type?: string;
	error_message?: string;
};

export type ScheduledTaskLifecycleLoggerPort = Pick<
	ScheduledTaskLifecycleLogger,
	'emit'
>;

export function markScheduledTaskLifecycleLogError(
	event: ScheduledTaskLifecycleLogEvent,
	error: unknown,
): void {
	event.outcome = 'error';
	event.error_type =
		error instanceof Error ? error.constructor.name : typeof error;
	event.error_message =
		error instanceof Error ? error.message : 'Unknown error';

	if (
		error instanceof ScheduledTaskExecutionFailedError &&
		error.apiStatus !== null
	)
		event.api_status = error.apiStatus;
}

@Injectable()
export class ScheduledTaskLifecycleLogger {
	constructor(
		@Inject(WorkerLogger)
		private readonly logger: WorkerLogger,
	) {}

	emit(event: ScheduledTaskLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
