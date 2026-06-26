import { z } from 'zod';

export const signUpSchema = z.object({
	username: z.string().trim().min(1),
	email: z
		.string()
		.trim()
		.email()
		.transform((value) => value.toLowerCase()),
	password: z.string().min(12).max(128),
});

export type SignUpSchemaInput = z.infer<typeof signUpSchema>;

export const confirmEmailSchema = z.object({
	token: z.string().trim().min(1),
});

export type ConfirmEmailSchemaInput = z.infer<typeof confirmEmailSchema>;

export const setPasswordSchema = z.object({
	token: z.string().trim().min(1),
	password: z.string().min(12).max(128),
});

export type SetPasswordSchemaInput = z.infer<typeof setPasswordSchema>;
