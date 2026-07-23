import {
	BadRequestDomainError,
	NotFoundDomainError,
	UnauthorizedDomainError,
} from '@app/common/errors/domain.error';

export class PaymentNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Payment not found.');
	}
}

export class PaymentAlreadyExistsError extends BadRequestDomainError {
	constructor() {
		super('Payment already exists.');
	}
}

export class PaymentAmountInvalidError extends BadRequestDomainError {
	constructor() {
		super('Payment amount must be greater than zero.');
	}
}

export class PaymentInvalidTransitionError extends BadRequestDomainError {
	constructor(currentStatus: string, nextStatus: string) {
		super(`Invalid payment transition: ${currentStatus} -> ${nextStatus}.`);
	}
}

export class PaymentHoldReleaseNotAllowedError extends BadRequestDomainError {
	constructor() {
		super('Payment hold can only be released after order completion.');
	}
}

export class PaymentCheckoutResumeNotAllowedError extends BadRequestDomainError {
	constructor() {
		super(
			'Payment checkout can only be resumed while the order is awaiting payment and the payment is awaiting confirmation.',
		);
	}
}

export class PaymentOrderNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Order not found.');
	}
}

export class PaymentGatewayError extends Error {
	constructor(
		readonly operation: 'initiate_payment' | 'fetch_notification',
		readonly gatewayStatus: number | null,
		readonly gatewayCause: string[],
		readonly cause?: unknown,
	) {
		super('Payment gateway request failed.');
	}
}

export class PaymentWebhookSignatureInvalidError extends UnauthorizedDomainError {
	constructor() {
		super('Invalid payment webhook signature.');
	}
}

export class PaymentWebhookNotificationMismatchError extends UnauthorizedDomainError {
	constructor() {
		super('Payment webhook notification is invalid.');
	}
}

export class PaymentWebhookTopicNotSupportedError extends UnauthorizedDomainError {
	constructor() {
		super('Payment webhook topic is not supported.');
	}
}
