import { z } from 'zod';
import { orderCredentialsEncryptionKeySchema } from './order-credentials-encryption-key';
import {
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
} from './wallet-funds-release.config';

const DEFAULT_JWT_ACCESS_TOKEN_SECRET = 'dev-secret';
const DEFAULT_INTERNAL_API_KEY = 'dev-internal-api-key';
const DEFAULT_JWT_REFRESH_TOKEN_SECRET = 'dev-refresh-secret';
const DEFAULT_EMAIL_CONFIRMATION_TOKEN_SECRET = 'dev-email-confirmation-secret';
const DEFAULT_ORDER_CREDENTIALS_ENCRYPTION_KEY =
	'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';

const PRODUCTION_ONLY_DEFAULT_SECRETS = {
	JWT_ACCESS_TOKEN_SECRET: DEFAULT_JWT_ACCESS_TOKEN_SECRET,
	INTERNAL_API_KEY: DEFAULT_INTERNAL_API_KEY,
	JWT_REFRESH_TOKEN_SECRET: DEFAULT_JWT_REFRESH_TOKEN_SECRET,
	EMAIL_CONFIRMATION_TOKEN_SECRET: DEFAULT_EMAIL_CONFIRMATION_TOKEN_SECRET,
	ORDER_CREDENTIALS_ENCRYPTION_KEY: DEFAULT_ORDER_CREDENTIALS_ENCRYPTION_KEY,
} as const;

const booleanEnvSchema = z
	.enum(['true', 'false'])
	.default('false')
	.transform((value) => value === 'true');

export const envSchema = z
	.object({
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		PORT: z.coerce.number().int().positive().default(3000),
		DATABASE_URL: z.string().trim().min(1),
		REDIS_URL: z.string().trim().min(1).default(DEFAULT_REDIS_URL),
		JWT_ACCESS_TOKEN_SECRET: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_JWT_ACCESS_TOKEN_SECRET),
		INTERNAL_API_KEY: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_INTERNAL_API_KEY),
		JWT_ACCESS_TOKEN_TTL_MINUTES: z.coerce
			.number()
			.int()
			.positive()
			.default(15),
		JWT_REFRESH_TOKEN_SECRET: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_JWT_REFRESH_TOKEN_SECRET),
		JWT_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
		EMAIL_CONFIRMATION_TOKEN_SECRET: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_EMAIL_CONFIRMATION_TOKEN_SECRET),
		EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES: z.coerce
			.number()
			.int()
			.positive()
			.default(30),
		ORDER_CREDENTIALS_ENCRYPTION_KEY:
			orderCredentialsEncryptionKeySchema.default(
				DEFAULT_ORDER_CREDENTIALS_ENCRYPTION_KEY,
			),
		MERCADO_PAGO_ACCESS_TOKEN: z.string().trim().min(1),
		MERCADO_PAGO_WEBHOOK_SECRET: z.string().trim().min(1),
		MERCADO_PAGO_WEBHOOK_URL: z.string().trim().url(),
		SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE: booleanEnvSchema,
		ORDER_QUOTE_TTL_MINUTES: z.coerce.number().int().positive().default(60),
		AUTH_LOGIN_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),
		AUTH_LOGIN_THROTTLE_TTL_SECONDS: z.coerce
			.number()
			.int()
			.positive()
			.default(60),
		AUTH_REFRESH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
		AUTH_REFRESH_THROTTLE_TTL_SECONDS: z.coerce
			.number()
			.int()
			.positive()
			.default(60),
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
	})
	.superRefine((env, context) => {
		if (env.NODE_ENV !== 'production') return;

		for (const [key, value] of Object.entries(
			PRODUCTION_ONLY_DEFAULT_SECRETS,
		)) {
			if (env[key as keyof typeof PRODUCTION_ONLY_DEFAULT_SECRETS] === value) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: [key],
					message:
						'Production environment must override development placeholder secrets.',
				});
			}
		}
	});

export type AppEnv = z.infer<typeof envSchema>;
