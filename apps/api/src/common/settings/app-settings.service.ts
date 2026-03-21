import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '@packages/config/env/env.schema';

@Injectable()
export class AppSettingsService {
	constructor(
		@Inject(ConfigService)
		private readonly config: ConfigService<AppEnv, true>,
	) {}

	get nodeEnv() {
		return this.config.getOrThrow('NODE_ENV', { infer: true });
	}

	get port() {
		return this.config.getOrThrow('PORT', { infer: true });
	}

	get databaseUrl() {
		return this.config.getOrThrow('DATABASE_URL', { infer: true });
	}

	get redisUrl() {
		return this.config.getOrThrow('REDIS_URL', { infer: true });
	}

	get jwtAccessTokenSecret() {
		return this.config.getOrThrow('JWT_ACCESS_TOKEN_SECRET', { infer: true });
	}

	get internalApiKey() {
		return this.config.getOrThrow('INTERNAL_API_KEY', { infer: true });
	}

	get jwtAccessTokenTtlMinutes() {
		return this.config.getOrThrow('JWT_ACCESS_TOKEN_TTL_MINUTES', {
			infer: true,
		});
	}

	get jwtRefreshTokenSecret() {
		return this.config.getOrThrow('JWT_REFRESH_TOKEN_SECRET', {
			infer: true,
		});
	}

	get jwtRefreshTokenTtlDays() {
		return this.config.getOrThrow('JWT_REFRESH_TOKEN_TTL_DAYS', {
			infer: true,
		});
	}

	get emailConfirmationTokenSecret() {
		return this.config.getOrThrow('EMAIL_CONFIRMATION_TOKEN_SECRET', {
			infer: true,
		});
	}

	get emailConfirmationTokenTtlMinutes() {
		return this.config.getOrThrow('EMAIL_CONFIRMATION_TOKEN_TTL_MINUTES', {
			infer: true,
		});
	}

	get mercadoPagoWebhookSecret() {
		return this.config.getOrThrow('MERCADO_PAGO_WEBHOOK_SECRET', {
			infer: true,
		});
	}

	get mercadoPagoAccessToken() {
		return this.config.getOrThrow('MERCADO_PAGO_ACCESS_TOKEN', {
			infer: true,
		});
	}

	get mercadoPagoWebhookUrl() {
		return this.config.getOrThrow('MERCADO_PAGO_WEBHOOK_URL', {
			infer: true,
		});
	}

	get orderQuoteTtlMinutes() {
		return this.config.getOrThrow('ORDER_QUOTE_TTL_MINUTES', {
			infer: true,
		});
	}

	get usersSignUpThrottleLimit() {
		return this.config.getOrThrow('USERS_SIGN_UP_THROTTLE_LIMIT', {
			infer: true,
		});
	}

	get usersSignUpThrottleTtlSeconds() {
		return this.config.getOrThrow('USERS_SIGN_UP_THROTTLE_TTL_SECONDS', {
			infer: true,
		});
	}

	get usersConfirmEmailThrottleLimit() {
		return this.config.getOrThrow('USERS_CONFIRM_EMAIL_THROTTLE_LIMIT', {
			infer: true,
		});
	}

	get usersConfirmEmailThrottleTtlSeconds() {
		return this.config.getOrThrow('USERS_CONFIRM_EMAIL_THROTTLE_TTL_SECONDS', {
			infer: true,
		});
	}

	get walletLockPeriodInHours() {
		return this.config.getOrThrow('WALLET_LOCK_PERIOD_HOURS', {
			infer: true,
		});
	}

	get walletFundsReleaseQueueName() {
		return this.config.getOrThrow('WALLET_FUNDS_RELEASE_QUEUE_NAME', {
			infer: true,
		});
	}

	get isProduction() {
		return this.nodeEnv === 'production';
	}

	get isDevelopment() {
		return this.nodeEnv === 'development';
	}

	get isTest() {
		return this.nodeEnv === 'test';
	}
}
