import {
	ConfigurableThrottlerGuard,
	type RouteThrottleConfig,
} from '@app/common/http/configurable-throttler.guard';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
	InjectThrottlerOptions,
	InjectThrottlerStorage,
	type ThrottlerModuleOptions,
	type ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ConfigurableThrottlerGuard {
	constructor(
		@InjectThrottlerOptions()
		options: ThrottlerModuleOptions,
		@InjectThrottlerStorage()
		storageService: ThrottlerStorage,
		reflector: Reflector,
		private readonly appSettings: AppSettingsService,
	) {
		super(options, storageService, reflector);
	}

	protected getThrottleConfig(
		context: ExecutionContext,
	): RouteThrottleConfig | null {
		switch (context.getHandler().name) {
			case 'login':
				return {
					name: 'auth-login',
					limit: this.appSettings.authLoginThrottleLimit,
					ttl: this.appSettings.authLoginThrottleTtlSeconds * 1000,
				};
			case 'refresh':
				return {
					name: 'auth-refresh',
					limit: this.appSettings.authRefreshThrottleLimit,
					ttl: this.appSettings.authRefreshThrottleTtlSeconds * 1000,
				};
			default:
				return null;
		}
	}
}
