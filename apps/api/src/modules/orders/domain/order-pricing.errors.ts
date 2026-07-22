import {
	BadRequestDomainError,
	ConflictDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class OrderUnsupportedPricingServiceTypeError extends BadRequestDomainError {
	constructor(serviceType: string) {
		super(`Pricing is not available for service type "${serviceType}".`);
	}
}

export class OrderRankProgressionInvalidError extends BadRequestDomainError {
	constructor() {
		super('Desired rank must be above the current rank.');
	}
}

export class OrderRankNotPricedError extends BadRequestDomainError {
	constructor() {
		super('The selected rank combination is not priced.');
	}
}

export class OrderQuoteNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Quote was not found.');
	}
}

export class OrderQuoteExpiredError extends BadRequestDomainError {
	constructor() {
		super('Quote has expired.');
	}
}

export class OrderQuoteAlreadyUsedError extends BadRequestDomainError {
	constructor() {
		super('Quote has already been used.');
	}
}

export type CouponInvalidReason =
	| 'not_found'
	| 'inactive'
	| 'discount_invalid'
	| 'not_first_order'
	| 'service_type_not_allowed'
	| 'queue_not_allowed'
	| 'email_not_allowed'
	| 'subtotal_below_minimum'
	| 'subtotal_above_maximum'
	| 'rank_below_minimum'
	| 'rank_above_maximum'
	| 'not_enough_extras'
	| 'required_extra_missing'
	| 'global_usage_limit_reached'
	| 'per_user_usage_limit_reached';

export const couponInvalidReasonMessages: Record<CouponInvalidReason, string> =
	{
		not_found: 'Coupon was not found.',
		inactive: 'Coupon is inactive.',
		discount_invalid: 'Coupon discount configuration is invalid.',
		not_first_order: 'Coupon is valid for the first order only.',
		service_type_not_allowed: 'Coupon is not valid for this service.',
		queue_not_allowed: 'Coupon is not valid for this queue.',
		email_not_allowed: 'Coupon is not valid for this account.',
		subtotal_below_minimum: 'Order total is below the coupon minimum.',
		subtotal_above_maximum: 'Order total is above the coupon maximum.',
		rank_below_minimum: 'Coupon requires a higher rank.',
		rank_above_maximum: 'Coupon requires a lower rank.',
		not_enough_extras: 'Order does not have enough extras for this coupon.',
		required_extra_missing: 'Coupon requires a specific extra.',
		global_usage_limit_reached: 'Coupon usage limit has been reached.',
		per_user_usage_limit_reached: 'You have already used this coupon.',
	};

export class OrderCouponInvalidError extends BadRequestDomainError {
	constructor(readonly reason: CouponInvalidReason) {
		super(couponInvalidReasonMessages[reason]);
	}
}

export class CouponCodeAlreadyExistsError extends ConflictDomainError {
	constructor() {
		super('Coupon code is already in use.');
	}
}

export class CouponNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Coupon was not found.');
	}
}

export class OrderPricingVersionNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Pricing version was not found.');
	}
}

export class OrderPricingVersionNotActiveError extends BadRequestDomainError {
	constructor() {
		super('There is no active pricing version.');
	}
}

export class OrderPricingVersionImmutableError extends BadRequestDomainError {
	constructor() {
		super('Only draft pricing versions can be changed.');
	}
}

export class OrderPricingVersionIncompleteError extends BadRequestDomainError {
	constructor() {
		super('Pricing version configuration is incomplete.');
	}
}

export class OrderPricingVersionNameInvalidError extends BadRequestDomainError {
	constructor() {
		super('Pricing version name is invalid.');
	}
}

export class OrderPricingVersionActiveConflictError extends ConflictDomainError {
	constructor() {
		super(
			'Pricing version activation is conflicting with another active version.',
		);
	}
}
