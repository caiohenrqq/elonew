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

export const saveOrderCredentialsSchema = z.object({
	login: z.string().trim().min(1),
	summonerName: z.string().trim().min(1),
	password: z.string().min(1),
	confirmPassword: z.string().min(1),
});

export type SaveOrderCredentialsSchemaInput = z.infer<
	typeof saveOrderCredentialsSchema
>;
