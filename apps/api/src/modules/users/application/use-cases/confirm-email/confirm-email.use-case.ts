import {
	EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY,
	type EmailConfirmationTokenServicePort,
} from '@modules/users/application/ports/email-confirmation-token.port';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { UserEmailConfirmationTokenInvalidError } from '@modules/users/domain/user.errors';
import { Inject, Injectable } from '@nestjs/common';

type ConfirmEmailInput = {
	token: string;
};

type ConfirmEmailOutput = {
	id: string;
	isActive: boolean;
	emailConfirmedAt: Date | null;
	emailConfirmationToken: string | null;
};

@Injectable()
export class ConfirmEmailUseCase {
	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY)
		private readonly emailConfirmationTokenService: EmailConfirmationTokenServicePort,
	) {}

	async execute(input: ConfirmEmailInput): Promise<ConfirmEmailOutput> {
		const tokenHash = this.emailConfirmationTokenService.hash(input.token);
		const user =
			await this.userRepository.findByEmailConfirmationTokenHash(tokenHash);
		if (!user || !user.canConfirmEmail(new Date()))
			throw new UserEmailConfirmationTokenInvalidError();

		const confirmedUser = user.confirmEmail(new Date());
		await this.userRepository.save(confirmedUser);

		return {
			id: confirmedUser.id,
			isActive: confirmedUser.isActive,
			emailConfirmedAt: confirmedUser.emailConfirmedAt,
			emailConfirmationToken: null,
		};
	}
}
