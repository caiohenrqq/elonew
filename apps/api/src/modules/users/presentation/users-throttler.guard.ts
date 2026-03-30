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
export class UsersThrottlerGuard extends ConfigurableThrottlerGuard {
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
			case 'signUp':
				return {
					name: 'users-sign-up',
					limit: this.appSettings.usersSignUpThrottleLimit,
					ttl: this.appSettings.usersSignUpThrottleTtlSeconds * 1000,
				};
			case 'confirmEmail':
				return {
					name: 'users-confirm-email',
					limit: this.appSettings.usersConfirmEmailThrottleLimit,
					ttl: this.appSettings.usersConfirmEmailThrottleTtlSeconds * 1000,
				};
			default:
				return null;
		}
	}
}
