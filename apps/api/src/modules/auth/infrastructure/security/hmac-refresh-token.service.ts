import { createHmac, randomBytes } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type RefreshTokenServicePort } from '@modules/auth/application/ports/token-service.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HmacRefreshTokenService implements RefreshTokenServicePort {
	constructor(private readonly appSettings: AppSettingsService) {}

	generate() {
		const rawToken = randomBytes(48).toString('base64url');

		return {
			rawToken,
			tokenHash: this.hash(rawToken),
			expiresAt: new Date(
				Date.now() +
					this.appSettings.jwtRefreshTokenTtlDays * 24 * 60 * 60 * 1000,
			),
		};
	}

	hash(token: string): string {
		return createHmac('sha256', this.appSettings.jwtRefreshTokenSecret)
			.update(token)
			.digest('hex');
	}
}
