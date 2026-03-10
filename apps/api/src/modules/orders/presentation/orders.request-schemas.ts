import { z } from 'zod';

export const acceptOrderSchema = z
	.object({
		boosterId: z.string().trim().min(1).optional(),
	})
	.optional();

export type AcceptOrderSchemaInput = z.infer<typeof acceptOrderSchema>;

export const saveOrderCredentialsSchema = z.object({
	login: z.string().trim().min(1),
	summonerName: z.string().trim().min(1),
	password: z.string().min(1),
	confirmPassword: z.string().min(1),
});

export type SaveOrderCredentialsSchemaInput = z.infer<
	typeof saveOrderCredentialsSchema
>;
