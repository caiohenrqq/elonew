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

export class PaymentCheckoutResumeNotAllowedError extends Error {
	constructor() {
		super(
			'Payment checkout can only be resumed while the order is awaiting payment and the payment is awaiting confirmation.',
		);
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

export class PaymentWebhookTopicNotSupportedError extends Error {
	constructor() {
		super('Payment webhook topic is not supported.');
	}
}
