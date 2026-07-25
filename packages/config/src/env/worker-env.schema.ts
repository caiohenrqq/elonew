import { z } from 'zod';
import {
	DEFAULT_ORDER_QUOTE_CLEANUP_CRON,
	DEFAULT_ORDER_QUOTE_CLEANUP_LIMIT,
	DEFAULT_SCHEDULED_TASKS_QUEUE_NAME,
	DEFAULT_STALE_CHECKOUT_RECONCILE_CRON,
	DEFAULT_STALE_CHECKOUT_RECONCILE_LIMIT,
} from './scheduled-tasks.config';
import {
	DEFAULT_API_INTERNAL_BASE_URL,
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
	DEFAULT_WORKER_CONCURRENCY,
} from './wallet-funds-release.config';

// Five whitespace-separated cron fields. Keeps a typo from silently disabling a
// recurring job: BullMQ would accept the string and simply never fire it.
const cronSchema = z
	.string()
	.trim()
	.regex(
		/^(\S+\s+){4}\S+$/,
		'Cron expression must have five space-separated fields.',
	);

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
		SCHEDULED_TASKS_QUEUE_NAME: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_SCHEDULED_TASKS_QUEUE_NAME),
		STALE_CHECKOUT_RECONCILE_CRON: cronSchema.default(
			DEFAULT_STALE_CHECKOUT_RECONCILE_CRON,
		),
		STALE_CHECKOUT_RECONCILE_LIMIT: z.coerce
			.number()
			.int()
			.min(1)
			.max(500)
			.default(DEFAULT_STALE_CHECKOUT_RECONCILE_LIMIT),
		ORDER_QUOTE_CLEANUP_CRON: cronSchema.default(
			DEFAULT_ORDER_QUOTE_CLEANUP_CRON,
		),
		ORDER_QUOTE_CLEANUP_LIMIT: z.coerce
			.number()
			.int()
			.min(1)
			.max(5000)
			.default(DEFAULT_ORDER_QUOTE_CLEANUP_LIMIT),
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
