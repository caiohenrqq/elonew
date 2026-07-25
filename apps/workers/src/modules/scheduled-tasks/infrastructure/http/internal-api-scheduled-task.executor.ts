import { randomUUID } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	type ScheduledTaskExecutionResult,
	type ScheduledTaskExecutorPort,
} from '@modules/scheduled-tasks/application/ports/scheduled-task-executor.port';
import { ScheduledTaskExecutionFailedError } from '@modules/scheduled-tasks/domain/scheduled-tasks.errors';
import type { ScheduledTask } from '@modules/scheduled-tasks/domain/scheduled-tasks.registry';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class InternalApiScheduledTaskExecutorAdapter
	implements ScheduledTaskExecutorPort
{
	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
	) {}

	async execute(task: ScheduledTask): Promise<ScheduledTaskExecutionResult> {
		// The API echoes this id back, so one tick can be followed across both
		// services' logs.
		const requestId = randomUUID();

		try {
			const response = await fetch(
				`${this.appSettings.apiInternalBaseUrl}${task.route}`,
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'x-internal-api-key': this.appSettings.internalApiKey,
						'x-request-id': requestId,
					},
					// Every sweep acts on the moment it runs; a tick delayed by a
					// restart must not work from a stale timestamp.
					body: JSON.stringify({
						...task.body,
						now: new Date().toISOString(),
					}),
				},
			);

			if (!response.ok)
				throw new ScheduledTaskExecutionFailedError(
					`Scheduled task "${task.name}" failed with status ${response.status}.`,
					response.status,
				);

			return {
				apiStatus: response.status,
				apiRequestId: response.headers.get('x-request-id') ?? requestId,
			};
		} catch (error) {
			if (error instanceof ScheduledTaskExecutionFailedError) throw error;

			const message =
				error instanceof Error ? error.message : 'Unknown transport failure';
			throw new ScheduledTaskExecutionFailedError(
				`Scheduled task "${task.name}" request failed: ${message}.`,
			);
		}
	}
}
