import { createHmac } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type AccessTokenServicePort } from '@modules/auth/application/ports/token-service.port';
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
}
