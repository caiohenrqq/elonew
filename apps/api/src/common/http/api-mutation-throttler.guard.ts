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

const UNTHROTTLED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class ApiMutationThrottlerGuard extends ConfigurableThrottlerGuard {
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
		if (context.getType() !== 'http') return null;

		const request = context.switchToHttp().getRequest<{
			method: string;
			url: string;
		}>();
		if (UNTHROTTLED_METHODS.has(request.method)) return null;
		// Worker-to-API traffic authenticates with the internal API key and
		// originates inside the compose network; throttling it could stall jobs.
		if (request.url.includes('/internal/')) return null;

		return {
			name: 'api-mutations',
			limit: this.appSettings.apiMutationThrottleLimit,
			ttl: this.appSettings.apiMutationThrottleTtlSeconds * 1000,
		};
	}
}
