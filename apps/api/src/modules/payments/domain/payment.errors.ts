export class PaymentNotFoundError extends Error {
	constructor() {
		super('Payment not found.');
	}
}

export class PaymentAlreadyExistsError extends Error {
	constructor() {
		super('Payment already exists.');
	}
}

export class PaymentAmountInvalidError extends Error {
	constructor() {
		super('Payment amount must be greater than zero.');
	}
}

export class PaymentInvalidTransitionError extends Error {
	constructor(currentStatus: string, nextStatus: string) {
		super(`Invalid payment transition: ${currentStatus} -> ${nextStatus}.`);
	}
}

export class PaymentHoldReleaseNotAllowedError extends Error {
	constructor() {
		super('Payment hold can only be released after order completion.');
	}
}

export class PaymentOrderNotFoundError extends Error {
	constructor() {
		super('Order not found.');
	}
}

export class PaymentWebhookSignatureInvalidError extends Error {
	constructor() {
		super('Invalid payment webhook signature.');
	}
}

export class PaymentWebhookNotificationMismatchError extends Error {
	constructor() {
		super('Payment webhook notification is invalid.');
	}
}
