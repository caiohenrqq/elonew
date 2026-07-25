import { OUTBOX_POLL_INTERVAL_MS } from '@app/common/outbox/outbox-dispatcher.service';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	SCHEDULED_JOBS_READER_KEY,
	type ScheduledJobQueueSnapshot,
	type ScheduledJobsReaderPort,
} from '@modules/admin/application/ports/scheduled-jobs-reader.port';
import { Inject, Injectable } from '@nestjs/common';

export type AdminScheduledJobsSnapshot = {
	queues: ScheduledJobQueueSnapshot[];
	inProcess: Array<{
		name: string;
		interval: string;
		location: string;
	}>;
};

@Injectable()
export class GetAdminScheduledJobsUseCase {
	constructor(
		@Inject(SCHEDULED_JOBS_READER_KEY)
		private readonly reader: ScheduledJobsReaderPort,
		private readonly appSettings: AppSettingsService,
	) {}

	async execute(): Promise<AdminScheduledJobsSnapshot> {
		const queues = await this.reader.readQueues([
			this.appSettings.scheduledTasksQueueName,
			this.appSettings.walletFundsReleaseQueueName,
		]);

		return {
			queues,
			// Not queue-backed, so it cannot be discovered from Redis. Listed anyway:
			// a view of scheduled work that hides a running loop is misleading.
			inProcess: [
				{
					name: 'outbox-dispatcher',
					interval: `every ${OUTBOX_POLL_INTERVAL_MS / 1000}s`,
					location: 'apps/api/src/common/outbox/outbox-dispatcher.service.ts',
				},
			],
		};
	}
}
