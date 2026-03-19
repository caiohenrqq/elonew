export class OrderUnsupportedPricingServiceTypeError extends Error {
	constructor(serviceType: string) {
		super(`Pricing is not available for service type "${serviceType}".`);
	}
}

export class OrderRankProgressionInvalidError extends Error {
	constructor() {
		super('Desired rank must be above the current rank.');
	}
}

export class OrderRankNotPricedError extends Error {
	constructor() {
		super('The selected rank combination is not priced.');
	}
}

export class OrderQuoteNotFoundError extends Error {
	constructor() {
		super('Quote was not found.');
	}
}

export class OrderQuoteExpiredError extends Error {
	constructor() {
		super('Quote has expired.');
	}
}

export class OrderQuoteAlreadyUsedError extends Error {
	constructor() {
		super('Quote has already been used.');
	}
}
