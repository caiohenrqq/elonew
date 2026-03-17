import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	AuthenticationRequiredError,
	InvalidAccessTokenError,
} from '@modules/auth/domain/auth.errors';
import {
	CanActivate,
	type ExecutionContext,
	Inject,
	Injectable,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type JwtPayload = {
	sub?: unknown;
	role?: unknown;
};

type JwtAuthGuardSettings = Pick<AppSettingsService, 'jwtAccessTokenSecret'>;

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: JwtAuthGuardSettings,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<{
			headers?: { authorization?: string };
			user?: AuthenticatedUser;
		}>();
		const token = this.getBearerToken(request.headers?.authorization);
		const payload = this.verifyToken(token);

		request.user = {
			id: payload.sub as string,
			role: payload.role as Role,
		};

		return true;
	}

	private getBearerToken(authorization?: string): string {
		if (!authorization?.startsWith('Bearer '))
			throw new AuthenticationRequiredError();

		return authorization.slice('Bearer '.length).trim();
	}

	private verifyToken(token: string): JwtPayload {
		const [encodedHeader, encodedPayload, encodedSignature, ...rest] =
			token.split('.');
		if (
			!encodedHeader ||
			!encodedPayload ||
			!encodedSignature ||
			rest.length > 0
		)
			throw new InvalidAccessTokenError();

		const expectedSignature = createHmac(
			'sha256',
			this.appSettings.jwtAccessTokenSecret,
		)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest();
		const receivedSignature = Buffer.from(encodedSignature, 'base64url');

		if (
			expectedSignature.length !== receivedSignature.length ||
			!timingSafeEqual(expectedSignature, receivedSignature)
		)
			throw new InvalidAccessTokenError();

		let payload: JwtPayload;
		try {
			payload = JSON.parse(
				Buffer.from(encodedPayload, 'base64url').toString('utf8'),
			) as JwtPayload;
		} catch {
			throw new InvalidAccessTokenError();
		}
		if (
			typeof payload.sub !== 'string' ||
			!Object.values(Role).includes(payload.role as Role)
		)
			throw new InvalidAccessTokenError();

		return payload;
	}
}
