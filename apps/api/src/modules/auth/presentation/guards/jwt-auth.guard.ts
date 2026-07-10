import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	type AccessTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import {
	AuthenticationRequiredError,
	AuthUserBlockedError,
	AuthUserInactiveError,
} from '@modules/auth/domain/auth.errors';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import {
	CanActivate,
	type ExecutionContext,
	Inject,
	Injectable,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		@Inject(ACCESS_TOKEN_SERVICE_KEY)
		private readonly accessTokenService: AccessTokenServicePort,
		@Inject(USER_REPOSITORY_KEY)
		private readonly users: UserRepositoryPort,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<{
			headers?: { authorization?: string };
			user?: AuthenticatedUser;
		}>();
		const token = this.getBearerToken(request.headers?.authorization);
		const tokenUser = this.accessTokenService.verify(token);
		const user = await this.users.findById(tokenUser.id);
		if (!user || !user.isActive) throw new AuthUserInactiveError();
		if (user.isBlocked) throw new AuthUserBlockedError();
		request.user = { id: user.id, role: user.role };

		return true;
	}

	private getBearerToken(authorization?: string): string {
		if (!authorization?.startsWith('Bearer '))
			throw new AuthenticationRequiredError();

		return authorization.slice('Bearer '.length).trim();
	}
}
