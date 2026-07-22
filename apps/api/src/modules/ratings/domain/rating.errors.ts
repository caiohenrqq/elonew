import {
	BadRequestDomainError,
	ConflictDomainError,
	ForbiddenDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class RatingOrderNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Order to rate was not found.');
	}
}

export class RatingNotAllowedError extends ForbiddenDomainError {
	constructor() {
		super('You are not allowed to rate this order.');
	}
}

export class OrderNotRatableError extends BadRequestDomainError {
	constructor() {
		super('Order can only be rated once completed.');
	}
}

export class RatingWindowClosedError extends BadRequestDomainError {
	constructor() {
		super('The rating window for this order has closed.');
	}
}

export class RatingAlreadySubmittedError extends ConflictDomainError {
	constructor() {
		super('You have already rated this order.');
	}
}

export class InvalidRatingScoreError extends BadRequestDomainError {
	constructor() {
		super('Rating score must be an integer between 1 and 5.');
	}
}
