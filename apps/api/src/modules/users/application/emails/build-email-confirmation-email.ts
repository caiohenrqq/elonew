import type { SendEmailInput } from '@app/common/email/ports/email-sender.port';

type EmailConfirmationEmailInput = {
	username: string;
	confirmationUrl: string;
	expiresInMinutes: number;
};

type EmailConfirmationEmailContent = Pick<
	SendEmailInput,
	'subject' | 'html' | 'text'
>;

const BRAND_NAME = 'EloNew';
const ACCENT_COLOR = '#0ea5e9';
const BACKGROUND_COLOR = '#09090b';
const SURFACE_COLOR = '#0d0d0f';
const TEXT_COLOR = '#ffffff';
const MUTED_TEXT_COLOR = 'rgba(255,255,255,0.55)';

export const buildEmailConfirmationEmail = (
	input: EmailConfirmationEmailInput,
): EmailConfirmationEmailContent => {
	const username = escapeHtml(input.username);
	const confirmationUrl = escapeHtml(input.confirmationUrl);

	const html = `
<!doctype html>
<html lang="pt-BR">
	<body style="margin:0;padding:0;background-color:${BACKGROUND_COLOR};">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND_COLOR};padding:32px 16px;">
			<tr>
				<td align="center">
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:${SURFACE_COLOR};border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
						<tr>
							<td style="height:4px;background:linear-gradient(90deg,transparent,${ACCENT_COLOR},transparent);"></td>
						</tr>
						<tr>
							<td style="padding:40px 40px 8px;font-family:Arial,Helvetica,sans-serif;">
								<p style="margin:0;color:${ACCENT_COLOR};font-size:12px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">${BRAND_NAME}</p>
								<h1 style="margin:16px 0 0;color:${TEXT_COLOR};font-size:22px;font-weight:bold;letter-spacing:1px;">Confirme seu e-mail</h1>
							</td>
						</tr>
						<tr>
							<td style="padding:16px 40px 0;font-family:Arial,Helvetica,sans-serif;">
								<p style="margin:0;color:${MUTED_TEXT_COLOR};font-size:14px;line-height:1.6;">
									Olá, <strong style="color:${TEXT_COLOR};">${username}</strong>. Falta só um passo para ativar sua conta na ${BRAND_NAME}. Clique no botão abaixo para confirmar seu endereço de e-mail.
								</p>
							</td>
						</tr>
						<tr>
							<td align="center" style="padding:32px 40px;">
								<a href="${confirmationUrl}" style="display:inline-block;background-color:${ACCENT_COLOR};color:${BACKGROUND_COLOR};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">Confirmar e-mail</a>
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px 8px;font-family:Arial,Helvetica,sans-serif;">
								<p style="margin:0;color:${MUTED_TEXT_COLOR};font-size:12px;line-height:1.6;">
									Se o botão não funcionar, copie e cole este link no seu navegador:
								</p>
								<p style="margin:8px 0 0;word-break:break-all;">
									<a href="${confirmationUrl}" style="color:${ACCENT_COLOR};font-size:12px;text-decoration:none;">${confirmationUrl}</a>
								</p>
							</td>
						</tr>
						<tr>
							<td style="padding:24px 40px 40px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid rgba(255,255,255,0.06);">
								<p style="margin:0;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.6;">
									Este link expira em ${input.expiresInMinutes} minutos. Se você não criou uma conta na ${BRAND_NAME}, ignore este e-mail.
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;

	const text = [
		`Olá, ${input.username}.`,
		'',
		`Confirme seu e-mail na ${BRAND_NAME} acessando o link abaixo:`,
		input.confirmationUrl,
		'',
		`Este link expira em ${input.expiresInMinutes} minutos. Se você não criou uma conta na ${BRAND_NAME}, ignore este e-mail.`,
	].join('\n');

	return {
		subject: `Confirme seu e-mail na ${BRAND_NAME}`,
		html,
		text,
	};
};

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
