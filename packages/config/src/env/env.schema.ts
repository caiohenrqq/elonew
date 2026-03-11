import { z } from 'zod';

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(3000),
	DATABASE_URL: z.string().trim().min(1),
	JWT_ACCESS_TOKEN_SECRET: z.string().trim().min(1).default('dev-secret'),
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
});

export type AppEnv = z.infer<typeof envSchema>;
