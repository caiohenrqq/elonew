import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
	InjectThrottlerOptions,
	InjectThrottlerStorage,
	ThrottlerGuard,
	type ThrottlerModuleOptions,
	type ThrottlerOptions,
	type ThrottlerStorage,
} from '@nestjs/throttler';

type UsersThrottleConfig = {
	limit: number;
	ttl: number;
	name: string;
};

@Injectable()
export class UsersThrottlerGuard extends ThrottlerGuard {
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

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const throttleConfig = this.getThrottleConfig(context);
		if (!throttleConfig) return true;

		const getTracker =
			this.commonOptions.getTracker ?? this.getTracker.bind(this);
		const generateKey =
			this.commonOptions.generateKey ?? this.generateKey.bind(this);

		return this.handleRequest({
			context,
			limit: throttleConfig.limit,
			ttl: throttleConfig.ttl,
			blockDuration: throttleConfig.ttl,
			throttler: throttleConfig,
			getTracker,
			generateKey,
		});
	}

	private getThrottleConfig(
		context: ExecutionContext,
	): (ThrottlerOptions & UsersThrottleConfig) | null {
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
