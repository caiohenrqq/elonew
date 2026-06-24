export class RatingOrderNotFoundError extends Error {
	constructor() {
		super('Order to rate was not found.');
	}
}

export class RatingNotAllowedError extends Error {
	constructor() {
		super('You are not allowed to rate this order.');
	}
}

export class OrderNotRatableError extends Error {
	constructor() {
		super('Order can only be rated once completed.');
	}
}

export class RatingWindowClosedError extends Error {
	constructor() {
		super('The rating window for this order has closed.');
	}
}

export class RatingAlreadySubmittedError extends Error {
	constructor() {
		super('You have already rated this order.');
	}
}

export class InvalidRatingScoreError extends Error {
	constructor() {
		super('Rating score must be an integer between 1 and 5.');
	}
}
