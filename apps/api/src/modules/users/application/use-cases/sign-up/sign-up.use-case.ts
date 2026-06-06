import {
	EMAIL_SENDER_KEY,
	type EmailSenderPort,
} from '@app/common/email/ports/email-sender.port';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { buildEmailConfirmationEmail } from '@modules/users/application/emails/build-email-confirmation-email';
import {
	EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY,
	type EmailConfirmationTokenServicePort,
} from '@modules/users/application/ports/email-confirmation-token.port';
import {
	PASSWORD_HASHER_KEY,
	type PasswordHasherPort,
} from '@modules/users/application/ports/password-hasher.port';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import {
	UserEmailAlreadyInUseError,
	UsernameAlreadyInUseError,
} from '@modules/users/domain/user.errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type SignUpInput = {
	username: string;
	email: string;
	password: string;
};

type SignUpOutput = {
	id: string;
	username: string;
	email: string;
	role: Role;
	isActive: boolean;
	emailConfirmedAt: Date | null;
	emailConfirmationPreviewToken: string | null;
};

@Injectable()
export class SignUpUseCase {
	private readonly logger = new Logger(SignUpUseCase.name);

	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(PASSWORD_HASHER_KEY)
		private readonly passwordHasher: PasswordHasherPort,
		@Inject(EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY)
		private readonly emailConfirmationTokenService: EmailConfirmationTokenServicePort,
		@Inject(EMAIL_SENDER_KEY)
		private readonly emailSender: EmailSenderPort,
		private readonly appSettings: AppSettingsService,
	) {}

	async execute(input: SignUpInput): Promise<SignUpOutput> {
		const normalizedEmail = input.email.trim().toLowerCase();
		const existingUser = await this.userRepository.findByEmail(normalizedEmail);
		if (existingUser) throw new UserEmailAlreadyInUseError();
		const existingUsername = await this.userRepository.findByUsername(
			input.username,
		);
		if (existingUsername) throw new UsernameAlreadyInUseError();
		const passwordHash = await this.passwordHasher.hash(input.password);
		const emailConfirmationToken =
			this.emailConfirmationTokenService.generate();

		const createdUser = await this.userRepository.create(
			User.createPending({
				username: input.username,
				email: normalizedEmail,
				passwordHash,
				emailConfirmationTokenHash: emailConfirmationToken.tokenHash,
				emailConfirmationTokenExpiresAt: emailConfirmationToken.expiresAt,
			}),
		);

		await this.sendConfirmationEmail({
			email: createdUser.email,
			token: emailConfirmationToken.rawToken,
			username: createdUser.username,
		});

		return {
			id: createdUser.id,
			username: createdUser.username,
			email: createdUser.email,
			role: createdUser.role,
			isActive: createdUser.isActive,
			emailConfirmedAt: createdUser.emailConfirmedAt,
			emailConfirmationPreviewToken: emailConfirmationToken.rawToken,
		};
	}

	private buildConfirmationUrl(token: string) {
		const url = new URL('/users/confirm-email', this.appSettings.webAppUrl);
		url.searchParams.set('token', token);
		return url.toString();
	}

	private async sendConfirmationEmail(input: {
		email: string;
		token: string;
		username: string;
	}) {
		try {
			const email = buildEmailConfirmationEmail({
				username: input.username,
				confirmationUrl: this.buildConfirmationUrl(input.token),
				expiresInMinutes: this.appSettings.emailConfirmationTokenTtlMinutes,
			});
			await this.emailSender.send({ to: input.email, ...email });
		} catch (error) {
			this.logger.warn(
				`Failed to send email confirmation to ${input.email}: ${formatEmailError(error)}`,
			);
		}
	}
}

const formatEmailError = (error: unknown) =>
	error instanceof Error ? error.message : 'Unknown email delivery error';
