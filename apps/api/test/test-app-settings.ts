import type { AppSettingsService } from '@app/common/settings/app-settings.service';

export function createTestAppSettings(
	overrides: Partial<Record<keyof AppSettingsService, unknown>> = {},
): Partial<Record<keyof AppSettingsService, unknown>> {
	return {
		port: 3000,
		databaseUrl: 'postgresql://test',
		jwtAccessTokenSecret: 'test-secret',
		jwtAccessTokenTtlMinutes: 15,
		jwtRefreshTokenSecret: 'test-refresh-secret',
		jwtRefreshTokenTtlDays: 7,
		emailConfirmationTokenSecret: 'test-email-confirmation-secret',
		emailConfirmationTokenTtlMinutes: 30,
		internalApiKey: 'test-internal-api-key',
		orderCredentialsEncryptionKey:
			'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
		authLoginThrottleLimit: 10,
		authLoginThrottleTtlSeconds: 60,
		authRefreshThrottleLimit: 10,
		authRefreshThrottleTtlSeconds: 60,
		usersSignUpThrottleLimit: 10,
		usersSignUpThrottleTtlSeconds: 60,
		usersConfirmEmailThrottleLimit: 10,
		usersConfirmEmailThrottleTtlSeconds: 60,
		orderQuoteTtlMinutes: 60,
		walletLockPeriodInHours: 72,
		isDevelopment: false,
		isTest: true,
		isProduction: false,
		...overrides,
	};
}
