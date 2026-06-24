import {
	EMAIL_SENDER_KEY,
	type EmailSenderPort,
} from '@app/common/email/ports/email-sender.port';
import {
	AUTH_SESSION_REPOSITORY_KEY,
	type AuthSessionRepositoryPort,
} from '@modules/auth/application/ports/auth-session-repository.port';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	type AccessTokenServicePort,
	REFRESH_TOKEN_SERVICE_KEY,
	type RefreshTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import {
	AuthInvalidCredentialsError,
	AuthUserBlockedError,
	AuthUserInactiveError,
} from '@modules/auth/domain/auth.errors';
import {
	PASSWORD_HASHER_KEY,
	type PasswordHasherPort,
} from '@modules/users/application/ports/password-hasher.port';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { Inject, Injectable, Logger } from '@nestjs/common';

type LoginInput = {
	email: string;
	password: string;
};

type LoginOutput = {
	accessToken: string;
	refreshToken: string;
	expiresInSeconds: number;
	user: {
		id: string;
		username: string;
		email: string;
		role: string;
		isActive: boolean;
	};
};

@Injectable()
export class LoginUseCase {
	private readonly logger = new Logger(LoginUseCase.name);

	constructor(
		@Inject(USER_REPOSITORY_KEY)
		private readonly userRepository: UserRepositoryPort,
		@Inject(PASSWORD_HASHER_KEY)
		private readonly passwordHasher: PasswordHasherPort,
		@Inject(AUTH_SESSION_REPOSITORY_KEY)
		private readonly authSessionRepository: AuthSessionRepositoryPort,
		@Inject(ACCESS_TOKEN_SERVICE_KEY)
		private readonly accessTokenService: AccessTokenServicePort,
		@Inject(REFRESH_TOKEN_SERVICE_KEY)
		private readonly refreshTokenService: RefreshTokenServicePort,
		@Inject(EMAIL_SENDER_KEY)
		private readonly emailSender: EmailSenderPort,
	) {}

	async execute(input: LoginInput): Promise<LoginOutput> {
		const normalizedEmail = input.email.trim().toLowerCase();
		const user = await this.userRepository.findByEmail(normalizedEmail);
		if (!user) throw new AuthInvalidCredentialsError();

		const passwordMatches = await this.passwordHasher.verify(
			input.password,
			user.passwordHash,
		);
		if (!passwordMatches) throw new AuthInvalidCredentialsError();
		if (!user.isActive) throw new AuthUserInactiveError();
		if (user.isBlocked) throw new AuthUserBlockedError();

		const refreshToken = this.refreshTokenService.generate();
		await this.authSessionRepository.create({
			userId: user.id,
			refreshTokenHash: refreshToken.tokenHash,
			expiresAt: refreshToken.expiresAt,
		});
		const accessToken = this.accessTokenService.sign({
			userId: user.id,
			role: user.role,
		});

		await this.sendLoginEmail({
			email: user.email,
			username: user.username,
		});

		return {
			accessToken: accessToken.token,
			refreshToken: refreshToken.rawToken,
			expiresInSeconds: accessToken.expiresInSeconds,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		};
	}

	private async sendLoginEmail(input: { email: string; username: string }) {
		try {
			await this.emailSender.send({
				to: input.email,
				subject: 'Novo acesso na sua conta EloNew',
				html: `
					<!doctype html>
					<html lang="pt-BR">
						<body style="margin:0;padding:0;background-color:#09090b;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
								<tr>
									<td align="center">
										<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0d0d0f;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
											<tr>
												<td style="height:4px;background-color:#0ea5e9;"></td>
											</tr>
											<tr>
												<td style="padding:40px;font-family:Arial,Helvetica,sans-serif;">
													<p style="margin:0;color:#0ea5e9;font-size:12px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">EloNew</p>
													<h1 style="margin:16px 0;color:#fafafa;font-size:22px;">Novo acesso detectado</h1>
													<p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.6;">
														Olá, <strong style="color:#fafafa;">${escapeHtml(input.username)}</strong>. Um novo login foi realizado na sua conta EloNew.
													</p>
													<p style="margin:24px 0 0;padding-top:24px;border-top:1px solid #27272a;color:#71717a;font-size:12px;line-height:1.6;">
														Se foi você, nenhuma ação é necessária. Se não reconhece este acesso, altere sua senha.
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</body>
					</html>
				`,
				text: `Olá, ${input.username}.\n\nUm novo login foi realizado na sua conta EloNew. Se foi você, nenhuma ação é necessária. Se não reconhece este acesso, altere sua senha.`,
			});
		} catch (error) {
			this.logger.warn(
				`Failed to send login notification to ${input.email}: ${formatEmailError(error)}`,
			);
		}
	}
}

const formatEmailError = (error: unknown) =>
	error instanceof Error ? error.message : 'Unknown email delivery error';

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
