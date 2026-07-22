import {
	ConflictDomainError,
	ForbiddenDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class ChatOrderNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Chat order not found.');
	}
}

export class ChatForbiddenError extends ForbiddenDomainError {
	constructor() {
		super('Chat access is forbidden.');
	}
}

export class ChatNotWritableError extends ConflictDomainError {
	constructor() {
		super('Chat is not writable for this order.');
	}
}

export class ChatMessageNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Chat message not found.');
	}
}
