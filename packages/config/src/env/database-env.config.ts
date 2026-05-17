import { z } from 'zod';

export const databaseEnvSchema = z.object({
	DATABASE_URL: z.string().trim().min(1),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function validateDatabaseEnv(
	config: Record<string, unknown>,
): DatabaseEnv {
	const result = databaseEnvSchema.safeParse(config);
	if (result.success) return result.data;

	const errors = result.error.issues
		.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
		.join('\n');

	throw new Error(`Database env validation failed:\n${errors}`);
}
