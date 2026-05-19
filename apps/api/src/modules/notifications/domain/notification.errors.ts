export class NotificationNotFoundError extends Error {
	constructor() {
		super('Notification not found.');
		this.name = 'NotificationNotFoundError';
	}
}

export class NotificationReadConflictError extends Error {
	constructor() {
		super('Notification changed before it could be marked read.');
		this.name = 'NotificationReadConflictError';
	}
}
