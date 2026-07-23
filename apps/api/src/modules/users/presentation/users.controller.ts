import { RouteThrottle } from '@app/common/http/route-throttle.decorator';
import { RouteThrottlerGuard } from '@app/common/http/route-throttler.guard';
import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { ConfirmEmailUseCase } from '@modules/users/application/use-cases/confirm-email/confirm-email.use-case';
import { SetPasswordUseCase } from '@modules/users/application/use-cases/set-password/set-password.use-case';
import { SignUpUseCase } from '@modules/users/application/use-cases/sign-up/sign-up.use-case';
import {
	type ConfirmEmailSchemaInput,
	confirmEmailSchema,
	type SetPasswordSchemaInput,
	type SignUpSchemaInput,
	setPasswordSchema,
	signUpSchema,
} from '@modules/users/presentation/users.request-schemas';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

@Controller('users')
@Public()
@UseGuards(RouteThrottlerGuard)
export class UsersController {
	constructor(
		private readonly signUpUseCase: SignUpUseCase,
		private readonly confirmEmailUseCase: ConfirmEmailUseCase,
		private readonly setPasswordUseCase: SetPasswordUseCase,
		private readonly appSettings: AppSettingsService,
	) {}

	@Post('sign-up')
	@RouteThrottle({
		name: 'users-sign-up',
		limit: 'usersSignUpThrottleLimit',
		ttlSeconds: 'usersSignUpThrottleTtlSeconds',
	})
	async signUp(
		@Body(new ZodValidationPipe(signUpSchema)) body: SignUpSchemaInput,
	) {
		const result = await this.signUpUseCase.execute({
			username: body.username,
			email: body.email,
			password: body.password,
		});

		return {
			id: result.id,
			username: result.username,
			email: result.email,
			role: result.role,
			isActive: result.isActive,
			emailConfirmedAt: result.emailConfirmedAt,
			emailConfirmationPreviewToken:
				this.appSettings.isDevelopment || this.appSettings.isTest
					? result.emailConfirmationPreviewToken
					: null,
		};
	}

	@Post('confirm-email')
	@RouteThrottle({
		name: 'users-confirm-email',
		limit: 'usersConfirmEmailThrottleLimit',
		ttlSeconds: 'usersConfirmEmailThrottleTtlSeconds',
	})
	confirmEmail(
		@Body(new ZodValidationPipe(confirmEmailSchema))
		body: ConfirmEmailSchemaInput,
	) {
		return this.confirmEmailUseCase.execute({
			token: body.token,
		});
	}

	@Post('set-password')
	setPassword(
		@Body(new ZodValidationPipe(setPasswordSchema))
		body: SetPasswordSchemaInput,
	) {
		return this.setPasswordUseCase.execute({
			token: body.token,
			password: body.password,
		});
	}
}
