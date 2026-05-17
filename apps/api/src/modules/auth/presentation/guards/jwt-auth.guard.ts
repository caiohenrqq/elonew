import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	type AccessTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import { AuthenticationRequiredError } from '@modules/auth/domain/auth.errors';
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
	) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<{
			headers?: { authorization?: string };
			user?: AuthenticatedUser;
		}>();
		const token = this.getBearerToken(request.headers?.authorization);
		request.user = this.accessTokenService.verify(token);

		return true;
	}

	private getBearerToken(authorization?: string): string {
		if (!authorization?.startsWith('Bearer '))
			throw new AuthenticationRequiredError();

		return authorization.slice('Bearer '.length).trim();
	}
}
