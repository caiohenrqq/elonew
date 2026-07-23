import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { AuthenticateAccessTokenUseCase } from '@modules/auth/application/use-cases/authenticate-access-token/authenticate-access-token.use-case';
import { AuthenticationRequiredError } from '@modules/auth/domain/auth.errors';
import { IS_PUBLIC_KEY } from '@modules/auth/presentation/decorators/public.decorator';
import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly authenticateAccessToken: AuthenticateAccessTokenUseCase,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Gateways authenticate their own handshake; this guard only covers HTTP.
		if (context.getType() !== 'http') return true;
		if (this.isPublic(context)) return true;

		const request = context.switchToHttp().getRequest<{
			headers?: { authorization?: string };
			user?: AuthenticatedUser;
		}>();
		const token = this.getBearerToken(request.headers?.authorization);
		request.user = await this.authenticateAccessToken.execute(token);

		return true;
	}

	private isPublic(context: ExecutionContext): boolean {
		return (
			this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
				context.getHandler(),
				context.getClass(),
			]) === true
		);
	}

	private getBearerToken(authorization?: string): string {
		if (!authorization?.startsWith('Bearer '))
			throw new AuthenticationRequiredError();

		return authorization.slice('Bearer '.length).trim();
	}
}
