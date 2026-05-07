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
	AuthRefreshTokenInvalidError,
	AuthRefreshTokenRevokedError,
	AuthUserBlockedError,
} from '@modules/auth/domain/auth.errors';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { Inject, Injectable } from '@nestjs/common';

type RefreshSessionInput = {
	refreshToken: string;
};

type RefreshSessionOutput = {
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
export class RefreshSessionUseCase {
	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(AUTH_SESSION_REPOSITORY_KEY)
		private readonly authSessionRepository: AuthSessionRepositoryPort,
		@Inject(ACCESS_TOKEN_SERVICE_KEY)
		private readonly accessTokenService: AccessTokenServicePort,
		@Inject(REFRESH_TOKEN_SERVICE_KEY)
		private readonly refreshTokenService: RefreshTokenServicePort,
	) {}

	async execute(input: RefreshSessionInput): Promise<RefreshSessionOutput> {
		const session = await this.authSessionRepository.findByRefreshTokenHash(
			this.refreshTokenService.hash(input.refreshToken),
		);
		if (!session) throw new AuthRefreshTokenInvalidError();
		if (session.revokedAt) throw new AuthRefreshTokenRevokedError();
		if (session.expiresAt.getTime() < Date.now())
			throw new AuthRefreshTokenInvalidError();

		const user = await this.userRepository.findById(session.userId);
		if (!user) throw new AuthRefreshTokenInvalidError();
		if (user.isBlocked) throw new AuthUserBlockedError();

		const nextRefreshToken = this.refreshTokenService.generate();
		session.refreshTokenHash = nextRefreshToken.tokenHash;
		session.expiresAt = nextRefreshToken.expiresAt;
		session.lastUsedAt = new Date();
		session.updatedAt = new Date();
		await this.authSessionRepository.save(session);

		const accessToken = this.accessTokenService.sign({
			userId: user.id,
			role: user.role,
		});

		return {
			accessToken: accessToken.token,
			refreshToken: nextRefreshToken.rawToken,
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
