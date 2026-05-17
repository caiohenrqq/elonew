import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { InvalidAccessTokenError } from '@modules/auth/domain/auth.errors';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { SESSION_COOKIE_NAME } from '@packages/auth/session/session-cookie';
import { unsealSessionPayload } from '@packages/auth/session/session-seal';

@Injectable()
export class WebSessionCookieService {
	constructor(private readonly appSettings: AppSettingsService) {}

	verifyCookieHeader(cookieHeader?: string): AuthenticatedUser | null {
		const sealedSession = this.getCookieValue(cookieHeader);
		if (!sealedSession) return null;

		const payload = unsealSessionPayload(
			sealedSession,
			this.appSettings.webSessionSecret,
		);
		if (!payload || payload.accessTokenExpiresAt <= Date.now())
			throw new InvalidAccessTokenError();
		if (
			!payload.userId ||
			!Object.values(Role).includes(payload.userRole as Role)
		)
			throw new InvalidAccessTokenError();

		return {
			id: payload.userId,
			role: payload.userRole as Role,
		};
	}

	private getCookieValue(cookieHeader?: string): string | null {
		if (!cookieHeader) return null;

		for (const cookie of cookieHeader.split(';')) {
			const [name, ...valueParts] = cookie.trim().split('=');
			if (name === SESSION_COOKIE_NAME) return valueParts.join('=');
		}

		return null;
	}
}
