import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { LoginUseCase } from '@modules/auth/application/use-cases/login/login.use-case';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout/logout.use-case';
import { RefreshSessionUseCase } from '@modules/auth/application/use-cases/refresh-session/refresh-session.use-case';
import { AuthThrottlerGuard } from '@modules/auth/presentation/guards/auth-throttler.guard';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
	type LoginSchemaInput,
	loginSchema,
	type RefreshSessionSchemaInput,
	refreshSessionSchema,
} from './auth.request-schemas';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly loginUseCase: LoginUseCase,
		private readonly refreshSessionUseCase: RefreshSessionUseCase,
		private readonly logoutUseCase: LogoutUseCase,
	) {}

	@Post('login')
	@UseGuards(AuthThrottlerGuard)
	async login(
		@Body(new ZodValidationPipe(loginSchema)) body: LoginSchemaInput,
	) {
		return await this.loginUseCase.execute(body);
	}

	@Post('refresh')
	@UseGuards(AuthThrottlerGuard)
	async refresh(
		@Body(new ZodValidationPipe(refreshSessionSchema))
		body: RefreshSessionSchemaInput,
	) {
		return await this.refreshSessionUseCase.execute(body);
	}

	@Post('logout')
	@HttpCode(200)
	async logout(
		@Body(new ZodValidationPipe(refreshSessionSchema))
		body: RefreshSessionSchemaInput,
	) {
		return await this.logoutUseCase.execute(body);
	}
}
