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

	canActivate(context: ExecutionContext): Promise<boolean> {
		const throttleConfig = this.getThrottleConfig(context);
		if (!throttleConfig) return Promise.resolve(true);

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

	// Authenticated requests are tracked per user, not per address: the web app
	// calls the API from its own server and forwards no client address, so every
	// signed-in caller would otherwise share a single bucket and one of them could
	// throttle everyone else out.
	//
	// Unauthenticated routes (login, sign-up) fall back to the address. Behind the
	// Cloudflare tunnel req.ip is the tunnel's, so CF-Connecting-IP is preferred;
	// it cannot be spoofed from outside because the tunnel is the only public
	// ingress.
	protected getTracker(req: Record<string, unknown>): Promise<string> {
		const user = req.user as { id?: string } | undefined;
		if (user?.id) return Promise.resolve(`user:${user.id}`);

		const headers = req.headers as
			| Record<string, string | string[] | undefined>
			| undefined;
		const header = headers?.['cf-connecting-ip'];
		const clientIp = Array.isArray(header) ? header.at(0) : header;

		return Promise.resolve(`ip:${clientIp ?? (req.ip as string)}`);
	}
}
