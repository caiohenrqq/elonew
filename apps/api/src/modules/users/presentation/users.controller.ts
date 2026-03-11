import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { ConfirmEmailUseCase } from '@modules/users/application/use-cases/confirm-email/confirm-email.use-case';
import { SignUpUseCase } from '@modules/users/application/use-cases/sign-up/sign-up.use-case';
import {
	confirmEmailSchema,
	signUpSchema,
} from '@modules/users/presentation/users.request-schemas';
import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

type SignUpBody = {
	username: string;
	email: string;
	password: string;
};

type ConfirmEmailBody = {
	token: string;
};

@Controller('users')
export class UsersController {
	constructor(
		private readonly signUpUseCase: SignUpUseCase,
		private readonly confirmEmailUseCase: ConfirmEmailUseCase,
		private readonly appSettings: AppSettingsService,
	) {}

	@Post('sign-up')
	@Throttle({
		default: {
			limit: 3,
			ttl: 60_000,
		},
	})
	async signUp(@Body(new ZodValidationPipe(signUpSchema)) body: SignUpBody) {
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
	@Throttle({
		default: {
			limit: 5,
			ttl: 60_000,
		},
	})
	confirmEmail(
		@Body(new ZodValidationPipe(confirmEmailSchema)) body: ConfirmEmailBody,
	) {
		return this.confirmEmailUseCase.execute({
			token: body.token,
		});
	}
}
