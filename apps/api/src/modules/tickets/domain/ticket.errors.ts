export class TicketNotFoundError extends Error {
	constructor() {
		super('Ticket was not found.');
	}
}

export class TicketAccessDeniedError extends Error {
	constructor() {
		super('Ticket access is denied.');
	}
}

export class TicketInvalidStatusTransitionError extends Error {
	constructor() {
		super('Ticket status transition is invalid.');
	}
}

export class TicketMessageOperationInvalidError extends Error {
	constructor() {
		super('Ticket message operation is invalid.');
	}
}

export class TicketOrderAccessDeniedError extends Error {
	constructor() {
		super('Ticket order link is not allowed.');
	}
}

export class TicketOrderLinkUnsupportedError extends Error {
	constructor() {
		super('Ticket order link is unsupported for this role.');
	}
}
