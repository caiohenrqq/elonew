import { z } from 'zod';

export const adminIdParamSchema = z.string().trim().min(1);

export type AdminIdParamSchemaInput = z.infer<typeof adminIdParamSchema>;

export const adminListQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(25),
	query: z.string().trim().min(1).max(120).optional(),
});

export type AdminListQuerySchemaInput = z.infer<typeof adminListQuerySchema>;

export const adminReasonSchema = z.object({
	reason: z.string().trim().min(1).max(500),
});

export type AdminReasonSchemaInput = z.infer<typeof adminReasonSchema>;
