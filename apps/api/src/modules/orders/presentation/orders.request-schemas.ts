import { z } from 'zod';

export const orderIdParamSchema = z.string().trim().min(1);

export type OrderIdParamSchemaInput = z.infer<typeof orderIdParamSchema>;

export const listClientOrdersQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListClientOrdersQuerySchemaInput = z.infer<
	typeof listClientOrdersQuerySchema
>;

export const listBoosterOrdersQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListBoosterOrdersQuerySchemaInput = z.infer<
	typeof listBoosterOrdersQuerySchema
>;

export const cleanupExpiredOrderQuotesSchema = z.object({
	now: z.string().datetime({ offset: true }),
	limit: z.coerce.number().int().min(1).max(5000).default(500),
});

export type CleanupExpiredOrderQuotesSchemaInput = z.infer<
	typeof cleanupExpiredOrderQuotesSchema
>;

// The API is the trust boundary: these bounds must hold for direct callers,
// not only for the web form.
export const saveOrderCredentialsSchema = z.object({
	login: z.string().trim().min(1).max(64),
	summonerName: z.string().trim().min(1).max(64),
	password: z.string().min(8).max(128),
	confirmPassword: z.string().min(8).max(128),
});

export type SaveOrderCredentialsSchemaInput = z.infer<
	typeof saveOrderCredentialsSchema
>;
