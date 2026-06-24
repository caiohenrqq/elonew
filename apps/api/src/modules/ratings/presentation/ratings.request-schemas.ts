import { z } from 'zod';

export const orderIdParamSchema = z.string().trim().min(1);

export type OrderIdParamSchemaInput = z.infer<typeof orderIdParamSchema>;

export const submitRatingSchema = z.object({
	orderId: z.string().trim().min(1),
	score: z.coerce.number().int().min(1).max(5),
	comment: z.string().trim().min(1).max(2000).optional(),
});

export type SubmitRatingSchemaInput = z.infer<typeof submitRatingSchema>;
