import type {
	OrderPricingExtraRate,
	OrderPricingStep,
} from '@modules/orders/application/order-pricing-version';
import {
	OrderPricingVersionIncompleteError,
	OrderPricingVersionNameInvalidError,
} from '@modules/orders/domain/order-pricing.errors';
import {
	type OrderExtraType,
	orderExtraTypes,
} from '@shared/orders/order-extra';
import {
	orderRankProgression,
	type RankPricedOrderServiceType,
	rankPricedOrderServiceTypes,
} from '@shared/orders/order-rank-progression';

export function normalizeOrderPricingVersionName(name: string): string {
	const normalizedName = name.trim();
	if (normalizedName.length === 0)
		throw new OrderPricingVersionNameInvalidError();

	return normalizedName;
}

export function assertOrderPricingVersionComplete(input: {
	steps: OrderPricingStep[];
	extras: OrderPricingExtraRate[];
}): void {
	for (const serviceType of rankPricedOrderServiceTypes) {
		for (const rankStep of orderRankProgression) {
			const exists = input.steps.some(
				(step) =>
					step.serviceType === serviceType &&
					normalizeLeague(step.league) === rankStep.league &&
					normalizeDivision(step.division) === rankStep.division,
			);
			if (!exists) throw new OrderPricingVersionIncompleteError();
		}
	}

	for (const extraType of orderExtraTypes) {
		const exists = input.extras.some((extra) => extra.type === extraType);
		if (!exists) throw new OrderPricingVersionIncompleteError();
	}
}

export function normalizePricingStep(input: {
	serviceType: RankPricedOrderServiceType;
	league: string;
	division: string;
	priceToNext: number;
}): OrderPricingStep {
	return {
		serviceType: input.serviceType,
		league: normalizeLeague(input.league),
		division: normalizeDivision(input.division),
		priceToNext: Number(input.priceToNext.toFixed(2)),
	};
}

export function normalizePricingExtra(input: {
	type: OrderExtraType;
	modifierRate: number;
}): OrderPricingExtraRate {
	return {
		type: input.type,
		modifierRate: Number(input.modifierRate.toFixed(4)),
	};
}

function normalizeLeague(league: string): string {
	return league.trim().toLowerCase();
}

function normalizeDivision(division: string): string {
	return division.trim().toUpperCase();
}
