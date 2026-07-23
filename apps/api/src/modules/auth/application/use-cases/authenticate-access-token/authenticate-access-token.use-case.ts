import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	type AccessTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import {
	AuthUserBlockedError,
	AuthUserInactiveError,
} from '@modules/auth/domain/auth.errors';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticateAccessTokenUseCase {
	constructor(
		@Inject(ACCESS_TOKEN_SERVICE_KEY)
		private readonly accessTokenService: AccessTokenServicePort,
		@Inject(USER_REPOSITORY_KEY)
		private readonly users: UserRepositoryPort,
	) {}

	async execute(token: string): Promise<AuthenticatedUser> {
		return await this.ensureUsable(this.accessTokenService.verify(token).id);
	}

	// A signed token only proves who issued it. Blocking and deactivation take
	// effect immediately, so every transport re-checks the stored user.
	async ensureUsable(userId: string): Promise<AuthenticatedUser> {
		const user = await this.users.findById(userId);
		if (!user || !user.isActive) throw new AuthUserInactiveError();
		if (user.isBlocked) throw new AuthUserBlockedError();

		return { id: user.id, role: user.role };
	}
}
