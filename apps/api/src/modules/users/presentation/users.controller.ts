import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { ConfirmEmailUseCase } from '@modules/users/application/use-cases/confirm-email/confirm-email.use-case';
import { SignUpUseCase } from '@modules/users/application/use-cases/sign-up/sign-up.use-case';
import {
	type ConfirmEmailSchemaInput,
	confirmEmailSchema,
	type SignUpSchemaInput,
	signUpSchema,
} from '@modules/users/presentation/users.request-schemas';
import { UsersThrottlerGuard } from '@modules/users/presentation/users-throttler.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

@Controller('users')
@UseGuards(UsersThrottlerGuard)
export class UsersController {
	constructor(
		private readonly signUpUseCase: SignUpUseCase,
		private readonly confirmEmailUseCase: ConfirmEmailUseCase,
		private readonly appSettings: AppSettingsService,
	) {}

	@Post('sign-up')
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
	confirmEmail(
		@Body(new ZodValidationPipe(confirmEmailSchema))
		body: ConfirmEmailSchemaInput,
	) {
		return this.confirmEmailUseCase.execute({
			token: body.token,
		});
	}
}
