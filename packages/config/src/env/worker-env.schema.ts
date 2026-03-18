import { z } from 'zod';
import {
	DEFAULT_API_INTERNAL_BASE_URL,
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
	DEFAULT_WORKER_CONCURRENCY,
} from './wallet-funds-release.config';

export const workerEnvSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	API_INTERNAL_BASE_URL: z
		.string()
		.trim()
		.min(1)
		.default(DEFAULT_API_INTERNAL_BASE_URL),
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
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
