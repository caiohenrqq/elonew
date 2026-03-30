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

export type RouteThrottleConfig = ThrottlerOptions & {
	limit: number;
	ttl: number;
	name: string;
};

@Injectable()
export abstract class ConfigurableThrottlerGuard extends ThrottlerGuard {
	constructor(
		@InjectThrottlerOptions()
		options: ThrottlerModuleOptions,
		@InjectThrottlerStorage()
		storageService: ThrottlerStorage,
		reflector: Reflector,
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

	protected abstract getThrottleConfig(
		context: ExecutionContext,
	): RouteThrottleConfig | null;
}
