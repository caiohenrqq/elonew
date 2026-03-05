import type { z } from 'zod';
import { envSchema } from './env.schema';

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
	const result = envSchema.safeParse(config);
	if (result.success) return result.data;

	const errors = result.error.issues
		.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
		.join('\n');

	throw new Error(`Env validation failed:\n${errors}`);
}
