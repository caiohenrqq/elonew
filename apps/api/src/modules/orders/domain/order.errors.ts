import {
	BadRequestDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class OrderNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Order not found.');
	}
}

export class OrderAlreadyExistsError extends BadRequestDomainError {
	constructor() {
		super('Order already exists.');
	}
}

export class OrderInvalidTransitionError extends BadRequestDomainError {
	constructor(currentStatus: string, nextStatus: string) {
		super(`Invalid order transition: ${currentStatus} -> ${nextStatus}.`);
	}
}

export class OrderCancellationNotAllowedError extends BadRequestDomainError {
	constructor() {
		super('Order cannot be cancelled after booster acceptance.');
	}
}

export class OrderCredentialsStorageNotAllowedError extends BadRequestDomainError {
	constructor() {
		super('Order credentials can only be stored after payment confirmation.');
	}
}

export class OrderCredentialsPasswordMismatchError extends BadRequestDomainError {
	constructor() {
		super('Order credentials password confirmation does not match.');
	}
}

export class OrderBoosterNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Selected booster not found.');
	}
}

export class OrderBoosterNotEligibleError extends BadRequestDomainError {
	constructor() {
		super('Selected user is not eligible for booster work.');
	}
}
