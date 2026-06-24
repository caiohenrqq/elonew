import { z } from 'zod';
import {
	DEFAULT_API_INTERNAL_BASE_URL,
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
	DEFAULT_WORKER_CONCURRENCY,
} from './wallet-funds-release.config';

const DEFAULT_INTERNAL_API_KEY = 'dev-internal-api-key';

export const workerEnvSchema = z
	.object({
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		API_INTERNAL_BASE_URL: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_API_INTERNAL_BASE_URL),
		INTERNAL_API_KEY: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_INTERNAL_API_KEY),
		REDIS_URL: z.string().trim().min(1).default(DEFAULT_REDIS_URL),
		WALLET_FUNDS_RELEASE_QUEUE_NAME: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME),
		WORKER_CONCURRENCY: z.coerce
			.number()
			.int()
			.positive()
			.default(DEFAULT_WORKER_CONCURRENCY),
	})
	.superRefine((env, context) => {
		if (
			env.NODE_ENV === 'production' &&
			env.INTERNAL_API_KEY === DEFAULT_INTERNAL_API_KEY
		)
			context.addIssue({
				code: 'custom',
				path: ['INTERNAL_API_KEY'],
				message: 'Production environment must override the internal API key.',
			});
	});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateWorkerEnv(config: Record<string, unknown>): WorkerEnv {
	const result = workerEnvSchema.safeParse(config);
	if (result.success) return result.data;

	const errors = result.error.issues
		.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
		.join('\n');

	throw new Error(`Worker env validation failed:\n${errors}`);
}
