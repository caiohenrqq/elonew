import { z } from 'zod';

export const createOrderSchema = z.object({
	boosterId: z.string().trim().min(1).optional(),
	quoteId: z.string().trim().min(1),
});

export type CreateOrderSchemaInput = z.infer<typeof createOrderSchema>;
