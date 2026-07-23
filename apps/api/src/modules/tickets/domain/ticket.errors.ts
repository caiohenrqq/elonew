import {
	BadRequestDomainError,
	ForbiddenDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class TicketNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Ticket was not found.');
	}
}

export class TicketAccessDeniedError extends ForbiddenDomainError {
	constructor() {
		super('Ticket access is denied.');
	}
}

export class TicketInvalidStatusTransitionError extends BadRequestDomainError {
	constructor() {
		super('Ticket status transition is invalid.');
	}
}

export class TicketMessageOperationInvalidError extends BadRequestDomainError {
	constructor() {
		super('Ticket message operation is invalid.');
	}
}

export class TicketOrderAccessDeniedError extends BadRequestDomainError {
	constructor() {
		super('Ticket order link is not allowed.');
	}
}

export class TicketOrderLinkUnsupportedError extends BadRequestDomainError {
	constructor() {
		super('Ticket order link is unsupported for this role.');
	}
}
