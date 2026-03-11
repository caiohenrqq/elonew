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

export const confirmEmailSchema = z.object({
	token: z.string().trim().min(1),
});
