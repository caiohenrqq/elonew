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

export class OrderCouponNotFoundError extends Error {
	constructor() {
		super('Coupon was not found.');
	}
}

export class OrderCouponInactiveError extends Error {
	constructor() {
		super('Coupon is inactive.');
	}
}

export class OrderCouponFirstOrderOnlyError extends Error {
	constructor() {
		super('Coupon is restricted to first orders.');
	}
}

export class OrderCouponDiscountInvalidError extends Error {
	constructor() {
		super('Coupon discount configuration is invalid.');
	}
}

export class OrderCouponInvalidError extends Error {
	constructor() {
		super('Coupon is invalid.');
	}
}

export class OrderPricingVersionNotFoundError extends Error {
	constructor() {
		super('Pricing version was not found.');
	}
}

export class OrderPricingVersionNotActiveError extends Error {
	constructor() {
		super('There is no active pricing version.');
	}
}

export class OrderPricingVersionImmutableError extends Error {
	constructor() {
		super('Only draft pricing versions can be changed.');
	}
}

export class OrderPricingVersionIncompleteError extends Error {
	constructor() {
		super('Pricing version configuration is incomplete.');
	}
}

export class OrderPricingVersionNameInvalidError extends Error {
	constructor() {
		super('Pricing version name is invalid.');
	}
}

export class OrderPricingVersionActiveConflictError extends Error {
	constructor() {
		super(
			'Pricing version activation is conflicting with another active version.',
		);
	}
}
