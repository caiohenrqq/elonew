import {
	AUTH_SESSION_REPOSITORY_KEY,
	type AuthSessionRepositoryPort,
} from '@modules/auth/application/ports/auth-session-repository.port';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	type AccessTokenServicePort,
	REFRESH_TOKEN_SERVICE_KEY,
	type RefreshTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import {
	AuthInvalidCredentialsError,
	AuthUserInactiveError,
} from '@modules/auth/domain/auth.errors';
import {
	PASSWORD_HASHER_KEY,
	type PasswordHasherPort,
} from '@modules/users/application/ports/password-hasher.port';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { Inject, Injectable } from '@nestjs/common';

type LoginInput = {
	email: string;
	password: string;
};

type LoginOutput = {
	accessToken: string;
	refreshToken: string;
	expiresInSeconds: number;
	user: {
		id: string;
		username: string;
		email: string;
		role: string;
		isActive: boolean;
	};
};

@Injectable()
export class LoginUseCase {
	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(PASSWORD_HASHER_KEY)
		private readonly passwordHasher: PasswordHasherPort,
		@Inject(AUTH_SESSION_REPOSITORY_KEY)
		private readonly authSessionRepository: AuthSessionRepositoryPort,
		@Inject(ACCESS_TOKEN_SERVICE_KEY)
		private readonly accessTokenService: AccessTokenServicePort,
		@Inject(REFRESH_TOKEN_SERVICE_KEY)
		private readonly refreshTokenService: RefreshTokenServicePort,
	) {}

	async execute(input: LoginInput): Promise<LoginOutput> {
		const normalizedEmail = input.email.trim().toLowerCase();
		const user = await this.userRepository.findByEmail(normalizedEmail);
		if (!user) throw new AuthInvalidCredentialsError();

		const passwordMatches = await this.passwordHasher.verify(
			input.password,
			user.passwordHash,
		);
		if (!passwordMatches) throw new AuthInvalidCredentialsError();
		if (!user.isActive) throw new AuthUserInactiveError();

		const refreshToken = this.refreshTokenService.generate();
		await this.authSessionRepository.create({
			userId: user.id,
			refreshTokenHash: refreshToken.tokenHash,
			expiresAt: refreshToken.expiresAt,
		});
		const accessToken = this.accessTokenService.sign({
			userId: user.id,
			role: user.role,
		});

		return {
			accessToken: accessToken.token,
			refreshToken: refreshToken.rawToken,
			expiresInSeconds: accessToken.expiresInSeconds,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		};
	}
}
