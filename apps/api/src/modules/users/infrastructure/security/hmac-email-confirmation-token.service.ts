import { createHmac, randomBytes } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type {
	EmailConfirmationTokenServicePort,
	GeneratedEmailConfirmationToken,
} from '@modules/users/application/ports/email-confirmation-token.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HmacEmailConfirmationTokenService
	implements EmailConfirmationTokenServicePort
{
	constructor(private readonly appSettings: AppSettingsService) {}

	generate(): GeneratedEmailConfirmationToken {
		const rawToken = randomBytes(32).toString('hex');

		return {
			rawToken,
			tokenHash: this.hash(rawToken),
			expiresAt: new Date(
				Date.now() + this.appSettings.emailConfirmationTokenTtlMinutes * 60_000,
			),
		};
	}

	hash(rawToken: string): string {
		return createHmac('sha256', this.appSettings.emailConfirmationTokenSecret)
			.update(rawToken)
			.digest('hex');
	}
}
