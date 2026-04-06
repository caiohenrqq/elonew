import { z } from 'zod';

export const orderIdParamSchema = z.string().trim().min(1);

export type OrderIdParamSchemaInput = z.infer<typeof orderIdParamSchema>;

export const saveOrderCredentialsSchema = z.object({
	login: z.string().trim().min(1),
	summonerName: z.string().trim().min(1),
	password: z.string().min(1),
	confirmPassword: z.string().min(1),
});

export type SaveOrderCredentialsSchemaInput = z.infer<
	typeof saveOrderCredentialsSchema
>;
