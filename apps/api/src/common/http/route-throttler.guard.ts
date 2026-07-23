import {
	ConfigurableThrottlerGuard,
	type RouteThrottleConfig,
} from '@app/common/http/configurable-throttler.guard';
import {
	ROUTE_THROTTLE_METADATA_KEY,
	type RouteThrottleMetadata,
} from '@app/common/http/route-throttle.decorator';
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
export class RouteThrottlerGuard extends ConfigurableThrottlerGuard {
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
		const metadata = this.reflector.getAllAndOverride<RouteThrottleMetadata>(
			ROUTE_THROTTLE_METADATA_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (!metadata) return null;

		return {
			name: metadata.name,
			limit: this.appSettings[metadata.limit],
			ttl: this.appSettings[metadata.ttlSeconds] * 1000,
		};
	}
}
