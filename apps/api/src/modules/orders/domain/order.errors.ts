export class OrderNotFoundError extends Error {
	constructor() {
		super('Order not found.');
	}
}

export class OrderAlreadyExistsError extends Error {
	constructor() {
		super('Order already exists.');
	}
}

export class OrderInvalidTransitionError extends Error {
	constructor(currentStatus: string, nextStatus: string) {
		super(`Invalid order transition: ${currentStatus} -> ${nextStatus}.`);
	}
}

export class OrderCancellationNotAllowedError extends Error {
	constructor() {
		super('Order cannot be cancelled after booster acceptance.');
	}
}
