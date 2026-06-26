import {
	EMAIL_SENDER_KEY,
	type EmailSenderPort,
} from '@app/common/email/ports/email-sender.port';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	type AdminUserLifecycleLogEvent,
	AdminUserLifecycleLogger,
	markAdminUserLifecycleLogError,
} from '@modules/admin/application/logging/admin-user-lifecycle.logger';
import {
	ADMIN_GOVERNANCE_REPOSITORY_KEY,
	type AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import {
	AdminUserNotFoundError,
	AdminUserPasswordSetupUnavailableError,
} from '@modules/admin/domain/admin.errors';
import { buildPasswordSetupEmail } from '@modules/users/application/emails/build-password-setup-email';
import {
	EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY,
	type EmailConfirmationTokenServicePort,
} from '@modules/users/application/ports/email-confirmation-token.port';
import { Inject, Injectable } from '@nestjs/common';

type ResendAdminUserPasswordSetupInput = {
	adminUserId: string;
	targetUserId: string;
	now: Date;
};

@Injectable()
export class ResendAdminUserPasswordSetupUseCase {
	constructor(
		@Inject(ADMIN_GOVERNANCE_REPOSITORY_KEY)
		private readonly governanceRepository: AdminGovernanceRepositoryPort,
		@Inject(EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY)
		private readonly tokenService: EmailConfirmationTokenServicePort,
		@Inject(EMAIL_SENDER_KEY)
		private readonly emailSender: EmailSenderPort,
		private readonly appSettings: AppSettingsService,
		private readonly lifecycleLogger: AdminUserLifecycleLogger,
	) {}

	async execute(
		input: ResendAdminUserPasswordSetupInput,
	): Promise<{ passwordSetupEmailSent: boolean }> {
		const startedAt = Date.now();
		const event: AdminUserLifecycleLogEvent = {
			event: 'admin_user.lifecycle',
			operation: 'resend_password_setup',
			admin_user_id: input.adminUserId,
			target_user_id: input.targetUserId,
			target_user_status_before: 'PENDING_ACTIVATION',
			target_user_status_after: 'PENDING_ACTIVATION',
			side_effects: [],
		};

		try {
			const user = await this.governanceRepository.findUserById(
				input.targetUserId,
			);
			if (!user) throw new AdminUserNotFoundError();
			event.target_user_role = user.role;

			if (user.isActive || user.emailConfirmedAt !== null)
				throw new AdminUserPasswordSetupUnavailableError();

			const token = this.tokenService.generate();
			await this.governanceRepository.saveUser(
				user.issuePasswordReset({
					tokenHash: token.tokenHash,
					expiresAt: token.expiresAt,
					issuedAt: input.now,
				}),
			);
			event.side_effects?.push('password_setup_token_refreshed');

			const emailSent = await this.sendPasswordSetupEmail({
				email: user.email,
				username: user.username,
				token: token.rawToken,
			});
			event.email_sent = emailSent;
			if (emailSent) event.side_effects?.push('password_setup_email_sent');
			event.outcome = 'success';

			return { passwordSetupEmailSent: emailSent };
		} catch (error) {
			markAdminUserLifecycleLogError(event, error);
			throw error;
		} finally {
			this.lifecycleLogger.emit(event, startedAt);
		}
	}

	private buildSetupUrl(token: string): string {
		const url = new URL('/users/set-password', this.appSettings.webAppUrl);
		url.searchParams.set('token', token);
		return url.toString();
	}

	private async sendPasswordSetupEmail(input: {
		email: string;
		username: string;
		token: string;
	}): Promise<boolean> {
		try {
			const email = buildPasswordSetupEmail({
				username: input.username,
				setupUrl: this.buildSetupUrl(input.token),
				expiresInMinutes: this.appSettings.emailConfirmationTokenTtlMinutes,
			});
			await this.emailSender.send({ to: input.email, ...email });
			return true;
		} catch {
			return false;
		}
	}
}
