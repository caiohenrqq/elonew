import type { AppEnv } from '@config/env/env.schema';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

	get isProduction() {
		return this.nodeEnv === 'production';
	}

	get isDevelopment() {
		return this.nodeEnv === 'development';
	}
}
