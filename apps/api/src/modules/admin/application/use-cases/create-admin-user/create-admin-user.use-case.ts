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
	AdminUserEmailAlreadyInUseError,
	AdminUsernameAlreadyInUseError,
} from '@modules/admin/domain/admin.errors';
import { buildPasswordSetupEmail } from '@modules/users/application/emails/build-password-setup-email';
import {
	EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY,
	type EmailConfirmationTokenServicePort,
} from '@modules/users/application/ports/email-confirmation-token.port';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import {
	UserEmailAlreadyInUseError,
	UsernameAlreadyInUseError,
} from '@modules/users/domain/user.errors';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type CreateAdminUserInput = {
	adminUserId: string;
	username: string;
	email: string;
	role: Role;
	now: Date;
};

type CreateAdminUserOutput = {
	id: string;
	username: string;
	email: string;
	role: Role;
	isActive: boolean;
	emailConfirmedAt: Date | null;
	passwordSetupEmailSent: boolean;
};

@Injectable()
export class CreateAdminUserUseCase {
	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(ADMIN_GOVERNANCE_REPOSITORY_KEY)
		private readonly governanceRepository: AdminGovernanceRepositoryPort,
		@Inject(EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY)
		private readonly tokenService: EmailConfirmationTokenServicePort,
		@Inject(EMAIL_SENDER_KEY)
		private readonly emailSender: EmailSenderPort,
		private readonly appSettings: AppSettingsService,
		private readonly lifecycleLogger: AdminUserLifecycleLogger,
	) {}

	async execute(input: CreateAdminUserInput): Promise<CreateAdminUserOutput> {
		const startedAt = Date.now();
		const event: AdminUserLifecycleLogEvent = {
			event: 'admin_user.lifecycle',
			operation: 'create',
			admin_user_id: input.adminUserId,
			target_user_role: input.role,
			target_user_status_after: 'PENDING_ACTIVATION',
			side_effects: [],
		};

		try {
			const normalizedEmail = input.email.trim().toLowerCase();
			await this.assertUniqueUser(input.username, normalizedEmail);
			const token = this.tokenService.generate();
			const user = await this.createUser({
				username: input.username,
				email: normalizedEmail,
				role: input.role,
				tokenHash: token.tokenHash,
				tokenExpiresAt: token.expiresAt,
			});
			event.target_user_id = user.id;
			event.side_effects?.push('user_created');

			await this.governanceRepository.recordAction({
				adminUserId: input.adminUserId,
				actionType: 'USER_CREATE',
				targetUserId: user.id,
				reason: 'admin_user_create',
				createdAt: input.now,
			});
			event.side_effects?.push('audit_recorded');

			const emailSent = await this.sendPasswordSetupEmail({
				email: user.email,
				username: user.username,
				token: token.rawToken,
			});
			event.email_sent = emailSent;
			if (emailSent) event.side_effects?.push('password_setup_email_sent');
			event.outcome = 'success';

			return {
				id: user.id,
				username: user.username,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
				emailConfirmedAt: user.emailConfirmedAt,
				passwordSetupEmailSent: emailSent,
			};
		} catch (error) {
			markAdminUserLifecycleLogError(event, error);
			throw error;
		} finally {
			this.lifecycleLogger.emit(event, startedAt);
		}
	}

	private async assertUniqueUser(
		username: string,
		email: string,
	): Promise<void> {
		if (await this.userRepository.findByEmail(email))
			throw new AdminUserEmailAlreadyInUseError();
		if (await this.userRepository.findByUsername(username))
			throw new AdminUsernameAlreadyInUseError();
	}

	private async createUser(input: {
		username: string;
		email: string;
		role: Role;
		tokenHash: string;
		tokenExpiresAt: Date;
	}): Promise<User> {
		try {
			return await this.userRepository.create(
				User.createPendingFromAdmin({
					username: input.username,
					email: input.email,
					role: input.role,
					passwordResetTokenHash: input.tokenHash,
					passwordResetTokenExpiresAt: input.tokenExpiresAt,
				}),
			);
		} catch (error) {
			if (error instanceof UserEmailAlreadyInUseError)
				throw new AdminUserEmailAlreadyInUseError();
			if (error instanceof UsernameAlreadyInUseError)
				throw new AdminUsernameAlreadyInUseError();
			throw error;
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
