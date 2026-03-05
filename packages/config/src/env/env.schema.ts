import { z } from 'zod';

const TRUE_VALUES = ['true', '1', 'yes', 'on'];
const FALSE_VALUES = ['false', '0', 'no', 'off'];

const booleanFromEnv = z.preprocess((value) => {
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (TRUE_VALUES.includes(normalized)) return true;
		if (FALSE_VALUES.includes(normalized)) return false;
	}

	return value;
}, z.boolean());

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	APP_VERSION: z.string().trim().min(1).default('dev'),
	REQUEST_SUCCESS_LOG_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1),
	CORS_ORIGINS: z.string().trim().default('*'),
	PORT: z.coerce.number().int().positive().default(3000),
	MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
	UPLOAD_DIR: z.string().trim().min(1).default('uploads'),
	DATABASE_URL: z.string().trim().min(1),
	DIRECT_URL: z.string().trim().min(1).optional(),
	RETRY_LLM_IF_ERROR: booleanFromEnv.default(true),
	RETRY_LLM_MAX_CHANCES: z.coerce.number().int().min(1).default(2),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1).default(60_000),
	RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(120),
	RATE_LIMIT_BILLS_MUTATION_MAX_REQUESTS: z.coerce
		.number()
		.int()
		.min(1)
		.default(8),
	BLOCK_BOT_USER_AGENTS: booleanFromEnv.default(true),
	OPENAI_API_KEY: z.string().trim().min(1),
});
