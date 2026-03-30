import { z } from 'zod';
import { orderExtraTypes } from './order-extra';
import { orderServiceTypes } from './service-type';

export const createOrderQuoteSchema = z.object({
	serviceType: z.enum(orderServiceTypes),
	couponCode: z.string().trim().min(1).optional(),
	extras: z
		.array(z.enum(orderExtraTypes))
		.default([])
		.refine((extras) => new Set(extras).size === extras.length, {
			message: 'Duplicate extras are not allowed.',
		}),
	currentLeague: z.string().trim().min(1),
	currentDivision: z.string().trim().min(1),
	currentLp: z.number().int().min(0).max(99),
	desiredLeague: z.string().trim().min(1),
	desiredDivision: z.string().trim().min(1),
	server: z.string().trim().min(1),
	desiredQueue: z.string().trim().min(1),
	lpGain: z.number().int(),
	deadline: z.string().datetime(),
});

export type CreateOrderQuoteSchemaInput = z.input<
	typeof createOrderQuoteSchema
>;
