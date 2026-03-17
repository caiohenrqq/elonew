import {
	AUTH_SESSION_REPOSITORY_KEY,
	type AuthSessionRepositoryPort,
} from '@modules/auth/application/ports/auth-session-repository.port';
import {
	REFRESH_TOKEN_SERVICE_KEY,
	type RefreshTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import {
	AuthRefreshTokenInvalidError,
	AuthRefreshTokenRevokedError,
} from '@modules/auth/domain/auth.errors';
import { Inject, Injectable } from '@nestjs/common';

type LogoutInput = {
	refreshToken: string;
};

@Injectable()
export class LogoutUseCase {
	constructor(
		@Inject(AUTH_SESSION_REPOSITORY_KEY)
		private readonly authSessionRepository: AuthSessionRepositoryPort,
		@Inject(REFRESH_TOKEN_SERVICE_KEY)
		private readonly refreshTokenService: RefreshTokenServicePort,
	) {}

	async execute(input: LogoutInput): Promise<{ success: true }> {
		const session = await this.authSessionRepository.findByRefreshTokenHash(
			this.refreshTokenService.hash(input.refreshToken),
		);
		if (!session) throw new AuthRefreshTokenInvalidError();
		if (session.revokedAt) throw new AuthRefreshTokenRevokedError();

		session.revokedAt = new Date();
		session.updatedAt = new Date();
		await this.authSessionRepository.save(session);

		return { success: true };
	}
}
