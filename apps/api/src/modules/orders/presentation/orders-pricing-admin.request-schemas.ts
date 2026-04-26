import { orderExtraTypes } from '@packages/shared/orders/order-extra';
import { rankPricedOrderServiceTypes } from '@packages/shared/orders/order-rank-progression';
import { z } from 'zod';

const pricingStepSchema = z.object({
	serviceType: z.enum(rankPricedOrderServiceTypes),
	league: z.string().trim().min(1),
	division: z.string().trim().min(1),
	priceToNext: z.number().finite().nonnegative(),
});

const pricingExtraSchema = z.object({
	type: z.enum(orderExtraTypes),
	modifierRate: z.number().finite().nonnegative(),
});

function hasDuplicateSteps(
	steps: Array<{
		serviceType: string;
		league: string;
		division: string;
	}>,
): boolean {
	const seen = new Set<string>();
	for (const step of steps) {
		const key = [
			step.serviceType,
			step.league.trim().toLowerCase(),
			step.division.trim().toUpperCase(),
		].join(':');
		if (seen.has(key)) return true;
		seen.add(key);
	}

	return false;
}

function hasDuplicateExtras(extras: Array<{ type: string }>): boolean {
	const seen = new Set<string>();
	for (const extra of extras) {
		if (seen.has(extra.type)) return true;
		seen.add(extra.type);
	}

	return false;
}

export const upsertOrderPricingVersionSchema = z
	.object({
		name: z.string().trim().min(1),
		steps: z.array(pricingStepSchema),
		extras: z.array(pricingExtraSchema),
	})
	.superRefine((value, ctx) => {
		if (hasDuplicateSteps(value.steps)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Duplicate pricing steps are not allowed.',
				path: ['steps'],
			});
		}
		if (hasDuplicateExtras(value.extras)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Duplicate pricing extras are not allowed.',
				path: ['extras'],
			});
		}
	});

export const orderPricingVersionIdParamSchema = z.string().trim().min(1);

export type UpsertOrderPricingVersionSchemaInput = z.infer<
	typeof upsertOrderPricingVersionSchema
>;
export type OrderPricingVersionIdParamSchemaInput = z.infer<
	typeof orderPricingVersionIdParamSchema
>;
