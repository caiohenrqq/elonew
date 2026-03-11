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
import { Inject, Injectable } from '@nestjs/common';
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
	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(PASSWORD_HASHER_KEY)
		private readonly passwordHasher: PasswordHasherPort,
		@Inject(EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY)
		private readonly emailConfirmationTokenService: EmailConfirmationTokenServicePort,
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
}
