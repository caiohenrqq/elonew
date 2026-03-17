import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().trim().email(),
	password: z.string().trim().min(1),
});

export const refreshSessionSchema = z.object({
	refreshToken: z.string().trim().min(1),
});

export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type RefreshSessionSchemaInput = z.infer<typeof refreshSessionSchema>;
