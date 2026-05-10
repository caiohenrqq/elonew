export class ChatOrderNotFoundError extends Error {
	constructor() {
		super('Chat order not found.');
	}
}

export class ChatForbiddenError extends Error {
	constructor() {
		super('Chat access is forbidden.');
	}
}

export class ChatNotWritableError extends Error {
	constructor() {
		super('Chat is not writable for this order.');
	}
}

export class ChatMessageNotFoundError extends Error {
	constructor() {
		super('Chat message not found.');
	}
}
