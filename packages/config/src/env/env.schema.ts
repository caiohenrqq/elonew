import { z } from 'zod';
import {
	DEFAULT_CHAT_SOCKET_ALLOWED_ORIGINS,
	parseChatSocketAllowedOrigins,
} from './chat-socket.config';
import { databaseEnvSchema } from './database-env.config';
import { orderCredentialsEncryptionKeySchema } from './order-credentials-encryption-key';
import {
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
} from './wallet-funds-release.config';

const DEFAULT_JWT_ACCESS_TOKEN_SECRET = 'dev-secret';
const DEFAULT_INTERNAL_API_KEY = 'dev-internal-api-key';
const DEFAULT_JWT_REFRESH_TOKEN_SECRET = 'dev-refresh-secret';
const DEFAULT_EMAIL_CONFIRMATION_TOKEN_SECRET = 'dev-email-confirmation-secret';
const DEFAULT_WEB_SESSION_SECRET =
	'a-very-secret-and-long-session-key-for-development-32chars';
const DEFAULT_ORDER_CREDENTIALS_ENCRYPTION_KEY =
	'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';

export const RESEND_API_KEY_PLACEHOLDER = 're_xxxxxxxxx';

const PRODUCTION_ONLY_DEFAULT_SECRETS = {
	JWT_ACCESS_TOKEN_SECRET: DEFAULT_JWT_ACCESS_TOKEN_SECRET,
	INTERNAL_API_KEY: DEFAULT_INTERNAL_API_KEY,
	JWT_REFRESH_TOKEN_SECRET: DEFAULT_JWT_REFRESH_TOKEN_SECRET,
	EMAIL_CONFIRMATION_TOKEN_SECRET: DEFAULT_EMAIL_CONFIRMATION_TOKEN_SECRET,
	WEB_SESSION_SECRET: DEFAULT_WEB_SESSION_SECRET,
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
		DATABASE_URL: databaseEnvSchema.shape.DATABASE_URL,
		REDIS_URL: z.string().trim().min(1).default(DEFAULT_REDIS_URL),
		CHAT_SOCKET_ALLOWED_ORIGINS: z
			.string()
			.trim()
			.min(1)
			.default(DEFAULT_CHAT_SOCKET_ALLOWED_ORIGINS)
			.transform(parseChatSocketAllowedOrigins)
			.refine((origins) => origins.length > 0, {
				message: 'At least one chat socket origin is required.',
			})
			.refine(
				(origins) =>
					origins.every((origin) => z.string().url().safeParse(origin).success),
				{ message: 'Chat socket origins must be valid URLs.' },
			),
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
		RESEND_API_KEY: z
			.string()
			.trim()
			.optional()
			.transform((value) => value || undefined),
		EMAIL_FROM: z.string().trim().min(1).default('onboarding@resend.dev'),
		WEB_SESSION_SECRET: z
			.string()
			.trim()
			.min(32)
			.default(DEFAULT_WEB_SESSION_SECRET),
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
		DEV_CHECKOUT_APP_URL: z
			.string()
			.trim()
			.url()
			.default('http://localhost:3001'),
		WEB_APP_URL: z.string().trim().url().default('http://localhost:3001'),
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
					code: 'custom',
					path: [key],
					message:
						'Production environment must override development placeholder secrets.',
				});
			}
		}

		if (
			env.CHAT_SOCKET_ALLOWED_ORIGINS.includes(
				DEFAULT_CHAT_SOCKET_ALLOWED_ORIGINS,
			)
		) {
			context.addIssue({
				code: 'custom',
				path: ['CHAT_SOCKET_ALLOWED_ORIGINS'],
				message:
					'Production environment must override development chat socket origins.',
			});
		}

		if (
			!env.RESEND_API_KEY ||
			env.RESEND_API_KEY === RESEND_API_KEY_PLACEHOLDER
		) {
			context.addIssue({
				code: 'custom',
				path: ['RESEND_API_KEY'],
				message:
					'Production environment requires a valid RESEND_API_KEY for email delivery.',
			});
		}
	});

export type AppEnv = z.infer<typeof envSchema>;
