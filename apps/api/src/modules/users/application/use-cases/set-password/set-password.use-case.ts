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
import { UserPasswordResetTokenInvalidError } from '@modules/users/domain/user.errors';
import { Inject, Injectable } from '@nestjs/common';

type SetPasswordInput = {
	token: string;
	password: string;
};

@Injectable()
export class SetPasswordUseCase {
	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(PASSWORD_HASHER_KEY)
		private readonly passwordHasher: PasswordHasherPort,
		@Inject(EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY)
		private readonly tokenService: EmailConfirmationTokenServicePort,
	) {}

	async execute(input: SetPasswordInput): Promise<{ ok: true }> {
		const tokenHash = this.tokenService.hash(input.token);
		const user =
			await this.userRepository.findByPasswordResetTokenHash(tokenHash);
		const now = new Date();
		if (!user || !user.canSetPassword(now))
			throw new UserPasswordResetTokenInvalidError();

		const passwordHash = await this.passwordHasher.hash(input.password);
		await this.userRepository.save(user.setPassword(passwordHash, now));

		return { ok: true };
	}
}
