export class UnknownScheduledTaskError extends Error {
	constructor(readonly taskName: string) {
		super(`Scheduled task "${taskName}" is not declared.`);
	}
}

export class ScheduledTaskExecutionFailedError extends Error {
	constructor(
		message = 'Scheduled task execution failed.',
		readonly apiStatus: number | null = null,
	) {
		super(message);
	}
}
