import { RouteThrottle } from '@app/common/http/route-throttle.decorator';
import { RouteThrottlerGuard } from '@app/common/http/route-throttler.guard';
import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { LoginUseCase } from '@modules/auth/application/use-cases/login/login.use-case';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout/logout.use-case';
import { RefreshSessionUseCase } from '@modules/auth/application/use-cases/refresh-session/refresh-session.use-case';
import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
	type LoginSchemaInput,
	loginSchema,
	type RefreshSessionSchemaInput,
	refreshSessionSchema,
} from './auth.request-schemas';

@Controller('auth')
@Public()
export class AuthController {
	constructor(
		private readonly loginUseCase: LoginUseCase,
		private readonly refreshSessionUseCase: RefreshSessionUseCase,
		private readonly logoutUseCase: LogoutUseCase,
	) {}

	@Post('login')
	@UseGuards(RouteThrottlerGuard)
	@RouteThrottle({
		name: 'auth-login',
		limit: 'authLoginThrottleLimit',
		ttlSeconds: 'authLoginThrottleTtlSeconds',
	})
	async login(
		@Body(new ZodValidationPipe(loginSchema)) body: LoginSchemaInput,
	) {
		return await this.loginUseCase.execute(body);
	}

	@Post('refresh')
	@UseGuards(RouteThrottlerGuard)
	@RouteThrottle({
		name: 'auth-refresh',
		limit: 'authRefreshThrottleLimit',
		ttlSeconds: 'authRefreshThrottleTtlSeconds',
	})
	async refresh(
		@Body(new ZodValidationPipe(refreshSessionSchema))
		body: RefreshSessionSchemaInput,
	) {
		return await this.refreshSessionUseCase.execute(body);
	}

	// ponytail: logout is deliberately unthrottled, matching previous behaviour
	// (the old guard had no matching case). Add @RouteThrottle if abuse shows up.
	@Post('logout')
	@HttpCode(200)
	async logout(
		@Body(new ZodValidationPipe(refreshSessionSchema))
		body: RefreshSessionSchemaInput,
	) {
		return await this.logoutUseCase.execute(body);
	}
}
