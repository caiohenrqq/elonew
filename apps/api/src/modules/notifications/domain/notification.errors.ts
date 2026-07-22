import {
	ConflictDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class NotificationNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Notification not found.');
		this.name = 'NotificationNotFoundError';
	}
}

export class NotificationReadConflictError extends ConflictDomainError {
	constructor() {
		super('Notification changed before it could be marked read.');
		this.name = 'NotificationReadConflictError';
	}
}
