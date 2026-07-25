export const SCHEDULED_JOBS_READER_KEY = Symbol('SCHEDULED_JOBS_READER_KEY');

export type ScheduledJobSchedulerSnapshot = {
	name: string;
	cron: string | null;
	nextRunAt: Date | null;
};

export type ScheduledJobPendingSnapshot = {
	id: string;
	name: string;
	dueAt: Date | null;
};

export type ScheduledJobQueueSnapshot = {
	queueName: string;
	counts: {
		delayed: number;
		waiting: number;
		active: number;
		failed: number;
		completed: number;
	};
	schedulers: ScheduledJobSchedulerSnapshot[];
	pending: ScheduledJobPendingSnapshot[];
};

export interface ScheduledJobsReaderPort {
	readQueues(queueNames: string[]): Promise<ScheduledJobQueueSnapshot[]>;
}
