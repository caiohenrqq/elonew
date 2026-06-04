import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Injectable, Logger } from '@nestjs/common';
import type {
	EmailSenderPort,
	SendEmailInput,
} from '../ports/email-sender.port';

@Injectable()
export class ResendEmailSender implements EmailSenderPort {
	private readonly logger = new Logger(ResendEmailSender.name);

	constructor(private readonly appSettings: AppSettingsService) {}

	async send(input: SendEmailInput): Promise<void> {
		const apiKey = this.appSettings.resendApiKey;
		if (!apiKey || apiKey === 're_xxxxxxxxx') {
			this.logger.debug(`Email delivery skipped for ${input.to}.`);
			return;
		}

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: this.appSettings.emailFrom,
				to: input.to,
				subject: input.subject,
				html: input.html,
				text: input.text,
			}),
		});

		if (!response.ok) {
			throw new Error(`Resend email delivery failed with ${response.status}.`);
		}
	}
}
