import { z } from 'zod';

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(3000),
	DATABASE_URL: z.string().trim().min(1),
});

export type AppEnv = z.infer<typeof envSchema>;
