import { z } from 'zod';
import {
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
} from './wallet-funds-release.config';

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(3000),
	DATABASE_URL: z.string().trim().min(1),
	REDIS_URL: z.string().trim().min(1).default(DEFAULT_REDIS_URL),
	JWT_ACCESS_TOKEN_SECRET: z.string().trim().min(1).default('dev-secret'),
	INTERNAL_API_KEY: z.string().trim().min(1).default('dev-internal-api-key'),
	JWT_ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
	JWT_REFRESH_TOKEN_SECRET: z
		.string()
		.trim()
		.min(1)
		.default('dev-refresh-secret'),
	JWT_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
	EMAIL_CONFIRMATION_TOKEN_SECRET: z
		.string()
		.trim()
		.min(1)
		.default('dev-email-confirmation-secret'),
	EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES: z.coerce
		.number()
		.int()
		.positive()
		.default(30),
	MERCADO_PAGO_ACCESS_TOKEN: z.string().trim().min(1),
	MERCADO_PAGO_WEBHOOK_SECRET: z.string().trim().min(1),
	MERCADO_PAGO_WEBHOOK_URL: z.string().trim().url(),
	ORDER_QUOTE_TTL_MINUTES: z.coerce.number().int().positive().default(60),
	USERS_SIGN_UP_THROTTLE_LIMIT: z.coerce.number().int().positive().default(3),
	USERS_SIGN_UP_THROTTLE_TTL_SECONDS: z.coerce
		.number()
		.int()
		.positive()
		.default(60),
	USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: z.coerce
		.number()
		.int()
		.positive()
		.default(5),
	USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: z.coerce
		.number()
		.int()
		.positive()
		.default(60),
	WALLET_LOCK_PERIOD_HOURS: z.coerce.number().int().positive().default(72),
	WALLET_FUNDS_RELEASE_QUEUE_NAME: z
		.string()
		.trim()
		.min(1)
		.default(DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME),
});

export type AppEnv = z.infer<typeof envSchema>;
