import { z } from 'zod';

const DEFAULT_PUBLIC_API_BASE_URL = 'http://localhost:3000';

const publicWebEnvSchema = z
	.object({
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		NEXT_PUBLIC_API_URL: z
			.preprocess((value) => {
				if (typeof value !== 'string') return value;
				const trimmed = value.trim();
				return trimmed.length === 0 ? undefined : trimmed;
			}, z.string().url().optional())
			.optional(),
	})
	.superRefine((env, context) => {
		if (env.NODE_ENV !== 'production' || env.NEXT_PUBLIC_API_URL) return;

		context.addIssue({
			code: 'custom',
			path: ['NEXT_PUBLIC_API_URL'],
			message: 'NEXT_PUBLIC_API_URL is required in production.',
		});
	});

const validatePublicWebEnv = () => {
	const result = publicWebEnvSchema.safeParse(process.env);
	if (result.success) return result.data;

	const errors = result.error.issues
		.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
		.join('\n');

	throw new Error(`Public web env validation failed:\n${errors}`);
};

export const getPublicApiBaseUrl = () => {
	const env = validatePublicWebEnv();
	const configuredUrl = env.NEXT_PUBLIC_API_URL;
	if (configuredUrl) return configuredUrl.replace(/\/$/, '');
	if (env.NODE_ENV !== 'production') return DEFAULT_PUBLIC_API_BASE_URL;
	throw new Error('NEXT_PUBLIC_API_URL is required in production.');
};
