import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { ConfigService } from '@nestjs/config';
import {
	type AppEnv,
	envSchema,
	RESEND_API_KEY_PLACEHOLDER,
} from '@packages/config/env/env.schema';
import { ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE } from '@packages/config/env/order-credentials-encryption-key';

describe('AppSettingsService', () => {
	it('exposes Mercado Pago webhook secret setting', () => {
		const config = {
			getOrThrow: jest.fn((key: keyof AppEnv) => {
				switch (key) {
					case 'CHAT_SOCKET_ALLOWED_ORIGINS':
						return ['https://app.example.com'];
					case 'MERCADO_PAGO_ACCESS_TOKEN':
						return 'mp-access-token';
					case 'MERCADO_PAGO_WEBHOOK_SECRET':
						return 'webhook-secret';
					case 'MERCADO_PAGO_WEBHOOK_URL':
						return 'https://example.com/payments/webhooks/mercadopago';
					case 'EMAIL_FROM':
						return 'EloNew <onboarding@resend.dev>';
					case 'SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE':
						return true;
					case 'DEV_CHECKOUT_APP_URL':
						return 'http://localhost:3001';
					default:
						throw new Error(`Unexpected config key: ${key}`);
				}
			}),
			get: jest.fn((key: keyof AppEnv) => {
				if (key === 'RESEND_API_KEY') return 're_test_key';
				throw new Error(`Unexpected config key: ${key}`);
			}),
		} as unknown as ConfigService<AppEnv, true>;
		const appSettings = new AppSettingsService(config);

		expect(appSettings.mercadoPagoAccessToken).toBe('mp-access-token');
		expect(appSettings.chatSocketAllowedOrigins).toEqual([
			'https://app.example.com',
		]);
		expect(appSettings.mercadoPagoWebhookSecret).toBe('webhook-secret');
		expect(appSettings.mercadoPagoWebhookUrl).toBe(
			'https://example.com/payments/webhooks/mercadopago',
		);
		expect(appSettings.resendApiKey).toBe('re_test_key');
		expect(appSettings.emailFrom).toBe('EloNew <onboarding@resend.dev>');
		expect(appSettings.skipMercadoPagoCheckoutInDevMode).toBe(true);
		expect(appSettings.devCheckoutAppUrl).toBe('http://localhost:3001');
	});

	it('parses the dev Mercado Pago checkout skip flag as a strict boolean string', () => {
		const result = envSchema.safeParse({
			NODE_ENV: 'development',
			PORT: 3000,
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
			CHAT_SOCKET_ALLOWED_ORIGINS:
				'https://app.example.com,https://admin.example.com',
			MERCADO_PAGO_ACCESS_TOKEN: 'mp-access-token',
			MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
			MERCADO_PAGO_WEBHOOK_URL:
				'https://example.com/payments/webhooks/mercadopago',
			RESEND_API_KEY: '',
			EMAIL_FROM: 'onboarding@resend.dev',
			SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE: 'true',
			DEV_CHECKOUT_APP_URL: 'https://beta.elonew.com.br',
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.data.RESEND_API_KEY).toBeUndefined();
		if (result.success)
			expect(result.data.SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE).toBe(true);
		if (result.success)
			expect(result.data.DEV_CHECKOUT_APP_URL).toBe(
				'https://beta.elonew.com.br',
			);
		if (result.success)
			expect(result.data.CHAT_SOCKET_ALLOWED_ORIGINS).toEqual([
				'https://app.example.com',
				'https://admin.example.com',
			]);
	});

	it('exposes security throttle and encryption settings', () => {
		const config = {
			getOrThrow: jest.fn((key: keyof AppEnv) => {
				switch (key) {
					case 'ORDER_CREDENTIALS_ENCRYPTION_KEY':
						return 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
					case 'AUTH_LOGIN_THROTTLE_LIMIT':
						return 5;
					case 'AUTH_LOGIN_THROTTLE_TTL_SECONDS':
						return 60;
					case 'AUTH_REFRESH_THROTTLE_LIMIT':
						return 8;
					case 'AUTH_REFRESH_THROTTLE_TTL_SECONDS':
						return 120;
					default:
						throw new Error(`Unexpected config key: ${key}`);
				}
			}),
		} as unknown as ConfigService<AppEnv, true>;
		const appSettings = new AppSettingsService(config);

		expect(appSettings.orderCredentialsEncryptionKey).toBe(
			'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
		);
		expect(appSettings.authLoginThrottleLimit).toBe(5);
		expect(appSettings.authLoginThrottleTtlSeconds).toBe(60);
		expect(appSettings.authRefreshThrottleLimit).toBe(8);
		expect(appSettings.authRefreshThrottleTtlSeconds).toBe(120);
	});

	it('requires Mercado Pago webhook secret in env parsing', () => {
		const result = envSchema.safeParse({
			NODE_ENV: 'test',
			PORT: 3000,
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
			REDIS_URL: 'redis://localhost:6379',
			JWT_ACCESS_TOKEN_SECRET: 'jwt-secret',
			INTERNAL_API_KEY: 'internal-api-key',
			JWT_ACCESS_TOKEN_TTL_MINUTES: 15,
			JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
			JWT_REFRESH_TOKEN_TTL_DAYS: 7,
			EMAIL_CONFIRMATION_TOKEN_SECRET: 'email-secret',
			EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES: 30,
			ORDER_CREDENTIALS_ENCRYPTION_KEY:
				'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
			MERCADO_PAGO_ACCESS_TOKEN: '',
			MERCADO_PAGO_WEBHOOK_SECRET: '',
			MERCADO_PAGO_WEBHOOK_URL: 'not-a-url',
			ORDER_QUOTE_TTL_MINUTES: 60,
			AUTH_LOGIN_THROTTLE_LIMIT: 5,
			AUTH_LOGIN_THROTTLE_TTL_SECONDS: 60,
			AUTH_REFRESH_THROTTLE_LIMIT: 8,
			AUTH_REFRESH_THROTTLE_TTL_SECONDS: 120,
			USERS_SIGN_UP_THROTTLE_LIMIT: 3,
			USERS_SIGN_UP_THROTTLE_TTL_SECONDS: 60,
			USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: 5,
			USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: 60,
			WALLET_LOCK_PERIOD_HOURS: 72,
			WALLET_FUNDS_RELEASE_QUEUE_NAME: 'wallet-funds-release',
		});

		expect(result.success).toBe(false);
	});

	it('rejects production env when security secrets are missing', () => {
		const result = envSchema.safeParse({
			NODE_ENV: 'production',
			PORT: 3000,
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
			REDIS_URL: 'redis://localhost:6379',
			MERCADO_PAGO_ACCESS_TOKEN: 'mp-access-token',
			MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
			MERCADO_PAGO_WEBHOOK_URL:
				'https://example.com/payments/webhooks/mercadopago',
			ORDER_QUOTE_TTL_MINUTES: 60,
			AUTH_LOGIN_THROTTLE_LIMIT: 5,
			AUTH_LOGIN_THROTTLE_TTL_SECONDS: 60,
			AUTH_REFRESH_THROTTLE_LIMIT: 8,
			AUTH_REFRESH_THROTTLE_TTL_SECONDS: 120,
			USERS_SIGN_UP_THROTTLE_LIMIT: 3,
			USERS_SIGN_UP_THROTTLE_TTL_SECONDS: 60,
			USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: 5,
			USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: 60,
			WALLET_LOCK_PERIOD_HOURS: 72,
			WALLET_FUNDS_RELEASE_QUEUE_NAME: 'wallet-funds-release',
		});

		expect(result.success).toBe(false);
	});

	it('rejects production env when placeholder secrets are used', () => {
		const result = envSchema.safeParse({
			NODE_ENV: 'production',
			PORT: 3000,
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
			REDIS_URL: 'redis://localhost:6379',
			JWT_ACCESS_TOKEN_SECRET: 'dev-secret',
			INTERNAL_API_KEY: 'dev-internal-api-key',
			JWT_ACCESS_TOKEN_TTL_MINUTES: 15,
			JWT_REFRESH_TOKEN_SECRET: 'dev-refresh-secret',
			JWT_REFRESH_TOKEN_TTL_DAYS: 7,
			EMAIL_CONFIRMATION_TOKEN_SECRET: 'dev-email-confirmation-secret',
			EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES: 30,
			ORDER_CREDENTIALS_ENCRYPTION_KEY:
				'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
			MERCADO_PAGO_ACCESS_TOKEN: 'mp-access-token',
			MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
			MERCADO_PAGO_WEBHOOK_URL:
				'https://example.com/payments/webhooks/mercadopago',
			ORDER_QUOTE_TTL_MINUTES: 60,
			AUTH_LOGIN_THROTTLE_LIMIT: 5,
			AUTH_LOGIN_THROTTLE_TTL_SECONDS: 60,
			AUTH_REFRESH_THROTTLE_LIMIT: 8,
			AUTH_REFRESH_THROTTLE_TTL_SECONDS: 120,
			USERS_SIGN_UP_THROTTLE_LIMIT: 3,
			USERS_SIGN_UP_THROTTLE_TTL_SECONDS: 60,
			USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: 5,
			USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: 60,
			WALLET_LOCK_PERIOD_HOURS: 72,
			WALLET_FUNDS_RELEASE_QUEUE_NAME: 'wallet-funds-release',
		});

		expect(result.success).toBe(false);
	});

	const buildValidProductionEnv = () => ({
		NODE_ENV: 'production',
		DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
		CHAT_SOCKET_ALLOWED_ORIGINS: 'https://app.example.com',
		JWT_ACCESS_TOKEN_SECRET: 'prod-access-secret',
		INTERNAL_API_KEY: 'prod-internal-key',
		JWT_REFRESH_TOKEN_SECRET: 'prod-refresh-secret',
		EMAIL_CONFIRMATION_TOKEN_SECRET: 'prod-email-secret',
		WEB_SESSION_SECRET: 'prod-session-secret-key-that-is-long-enough',
		ORDER_CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64url'),
		MERCADO_PAGO_ACCESS_TOKEN: 'mp-access-token',
		MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
		MERCADO_PAGO_WEBHOOK_URL:
			'https://example.com/payments/webhooks/mercadopago',
	});

	it('rejects production env when the Resend API key is missing', () => {
		const result = envSchema.safeParse(buildValidProductionEnv());

		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.error.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: ['RESEND_API_KEY'] }),
			]),
		);
	});

	it('rejects production env when the Resend API key is still the placeholder', () => {
		const result = envSchema.safeParse({
			...buildValidProductionEnv(),
			RESEND_API_KEY: RESEND_API_KEY_PLACEHOLDER,
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.error.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: ['RESEND_API_KEY'] }),
			]),
		);
	});

	it('accepts production env when a real Resend API key is provided', () => {
		const result = envSchema.safeParse({
			...buildValidProductionEnv(),
			RESEND_API_KEY: 're_live_realkey',
		});

		expect(result.success).toBe(true);
	});

	it('rejects malformed order credentials encryption keys during env parsing', () => {
		const result = envSchema.safeParse({
			NODE_ENV: 'test',
			PORT: 3000,
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
			REDIS_URL: 'redis://localhost:6379',
			JWT_ACCESS_TOKEN_SECRET: 'jwt-secret',
			INTERNAL_API_KEY: 'internal-api-key',
			JWT_ACCESS_TOKEN_TTL_MINUTES: 15,
			JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
			JWT_REFRESH_TOKEN_TTL_DAYS: 7,
			EMAIL_CONFIRMATION_TOKEN_SECRET: 'email-secret',
			EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES: 30,
			ORDER_CREDENTIALS_ENCRYPTION_KEY: 'not-valid-base64',
			MERCADO_PAGO_ACCESS_TOKEN: 'mp-access-token',
			MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
			MERCADO_PAGO_WEBHOOK_URL:
				'https://example.com/payments/webhooks/mercadopago',
			ORDER_QUOTE_TTL_MINUTES: 60,
			AUTH_LOGIN_THROTTLE_LIMIT: 5,
			AUTH_LOGIN_THROTTLE_TTL_SECONDS: 60,
			AUTH_REFRESH_THROTTLE_LIMIT: 8,
			AUTH_REFRESH_THROTTLE_TTL_SECONDS: 120,
			USERS_SIGN_UP_THROTTLE_LIMIT: 3,
			USERS_SIGN_UP_THROTTLE_TTL_SECONDS: 60,
			USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: 5,
			USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: 60,
			WALLET_LOCK_PERIOD_HOURS: 72,
			WALLET_FUNDS_RELEASE_QUEUE_NAME: 'wallet-funds-release',
		});

		expect(result.success).toBe(false);
		if (result.success) return;

		expect(result.error.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: ['ORDER_CREDENTIALS_ENCRYPTION_KEY'],
					message: ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE,
				}),
			]),
		);
	});

	it('accepts base64url order credentials encryption keys during env parsing', () => {
		const result = envSchema.safeParse({
			NODE_ENV: 'test',
			PORT: 3000,
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elonew',
			REDIS_URL: 'redis://localhost:6379',
			JWT_ACCESS_TOKEN_SECRET: 'jwt-secret',
			INTERNAL_API_KEY: 'internal-api-key',
			JWT_ACCESS_TOKEN_TTL_MINUTES: 15,
			JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
			JWT_REFRESH_TOKEN_TTL_DAYS: 7,
			EMAIL_CONFIRMATION_TOKEN_SECRET: 'email-secret',
			EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES: 30,
			ORDER_CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(32, 255).toString(
				'base64url',
			),
			MERCADO_PAGO_ACCESS_TOKEN: 'mp-access-token',
			MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
			MERCADO_PAGO_WEBHOOK_URL:
				'https://example.com/payments/webhooks/mercadopago',
			ORDER_QUOTE_TTL_MINUTES: 60,
			AUTH_LOGIN_THROTTLE_LIMIT: 5,
			AUTH_LOGIN_THROTTLE_TTL_SECONDS: 60,
			AUTH_REFRESH_THROTTLE_LIMIT: 8,
			AUTH_REFRESH_THROTTLE_TTL_SECONDS: 120,
			USERS_SIGN_UP_THROTTLE_LIMIT: 3,
			USERS_SIGN_UP_THROTTLE_TTL_SECONDS: 60,
			USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: 5,
			USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: 60,
			WALLET_LOCK_PERIOD_HOURS: 72,
			WALLET_FUNDS_RELEASE_QUEUE_NAME: 'wallet-funds-release',
		});

		expect(result.success).toBe(true);
	});
});
