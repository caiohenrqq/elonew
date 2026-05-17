import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type AccessTokenServicePort } from '@modules/auth/application/ports/token-service.port';
import { InvalidAccessTokenError } from '@modules/auth/domain/auth.errors';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type AccessTokenPayload = {
	sub: string;
	role: Role;
	issuedAt: number;
	expiresAt: number;
};

@Injectable()
export class HmacAccessTokenService implements AccessTokenServicePort {
	constructor(private readonly appSettings: AppSettingsService) {}

	sign(input: { userId: string; role: Role }) {
		const issuedAt = Math.floor(Date.now() / 1000);
		const expiresInSeconds = this.appSettings.jwtAccessTokenTtlMinutes * 60;
		const payload: AccessTokenPayload = {
			sub: input.userId,
			role: input.role,
			issuedAt,
			expiresAt: issuedAt + expiresInSeconds,
		};
		const encodedHeader = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
			'base64url',
		);
		const signature = createHmac(
			'sha256',
			this.appSettings.jwtAccessTokenSecret,
		)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest('base64url');

		return {
			token: `${encodedHeader}.${encodedPayload}.${signature}`,
			expiresInSeconds,
		};
	}

	verify(token: string) {
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

		let payload: Partial<AccessTokenPayload>;
		try {
			payload = JSON.parse(
				Buffer.from(encodedPayload, 'base64url').toString('utf8'),
			) as Partial<AccessTokenPayload>;
		} catch {
			throw new InvalidAccessTokenError();
		}
		if (
			typeof payload.sub !== 'string' ||
			!Object.values(Role).includes(payload.role as Role) ||
			typeof payload.expiresAt !== 'number' ||
			typeof payload.issuedAt !== 'number' ||
			payload.expiresAt <= Math.floor(Date.now() / 1000)
		)
			throw new InvalidAccessTokenError();

		return {
			id: payload.sub,
			role: payload.role as Role,
		};
	}
}
