import { z } from 'zod';
import { orderServiceTypes } from './service-type';

export const createOrderSchema = z.object({
	serviceType: z.enum(orderServiceTypes),
	currentLeague: z.string().trim().min(1),
	currentDivision: z.string().trim().min(1),
	currentLp: z.number().int(),
	desiredLeague: z.string().trim().min(1),
	desiredDivision: z.string().trim().min(1),
	server: z.string().trim().min(1),
	desiredQueue: z.string().trim().min(1),
	lpGain: z.number().int(),
	deadline: z.string().datetime(),
});

export type CreateOrderSchemaInput = z.infer<typeof createOrderSchema>;
