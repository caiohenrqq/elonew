import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { ConfigService } from '@nestjs/config';
import { type AppEnv, envSchema } from '@packages/config/env/env.schema';

describe('AppSettingsService', () => {
	it('exposes Mercado Pago webhook secret setting', () => {
		const config = {
			getOrThrow: jest.fn((key: keyof AppEnv) => {
				switch (key) {
					case 'MERCADO_PAGO_WEBHOOK_SECRET':
						return 'webhook-secret';
					default:
						throw new Error(`Unexpected config key: ${key}`);
				}
			}),
		} as unknown as ConfigService<AppEnv, true>;
		const appSettings = new AppSettingsService(config);

		expect(appSettings.mercadoPagoWebhookSecret).toBe('webhook-secret');
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
			MERCADO_PAGO_WEBHOOK_SECRET: '',
			ORDER_QUOTE_TTL_MINUTES: 60,
			USERS_SIGN_UP_THROTTLE_LIMIT: 3,
			USERS_SIGN_UP_THROTTLE_TTL_SECONDS: 60,
			USERS_CONFIRM_EMAIL_THROTTLE_LIMIT: 5,
			USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS: 60,
			WALLET_LOCK_PERIOD_HOURS: 72,
			WALLET_FUNDS_RELEASE_QUEUE_NAME: 'wallet-funds-release',
		});

		expect(result.success).toBe(false);
	});
});
