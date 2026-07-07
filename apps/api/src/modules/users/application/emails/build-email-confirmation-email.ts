import {
	BRAND_NAME,
	buildBrandedEmailHtml,
	escapeHtml,
	MUTED_TEXT_COLOR,
	TEXT_COLOR,
} from '@app/common/email/build-branded-email';
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

export const buildEmailConfirmationEmail = (
	input: EmailConfirmationEmailInput,
): EmailConfirmationEmailContent => {
	const username = escapeHtml(input.username);
	const footerText = `Este link expira em ${input.expiresInMinutes} minutos. Se você não criou uma conta na ${BRAND_NAME}, ignore este e-mail.`;

	const html = buildBrandedEmailHtml({
		title: 'Confirme seu e-mail',
		contentHtml: `<p style="margin:0;color:${MUTED_TEXT_COLOR};font-size:14px;line-height:1.6;">
									Olá, <strong style="color:${TEXT_COLOR};">${username}</strong>. Falta só um passo para ativar sua conta na ${BRAND_NAME}. Clique no botão abaixo para confirmar seu endereço de e-mail.
								</p>`,
		ctaLabel: 'Confirmar e-mail',
		ctaUrl: input.confirmationUrl,
		showLinkFallback: true,
		footerText,
	});

	const text = [
		`Olá, ${input.username}.`,
		'',
		`Confirme seu e-mail na ${BRAND_NAME} acessando o link abaixo:`,
		input.confirmationUrl,
		'',
		footerText,
	].join('\n');

	return {
		subject: `Confirme seu e-mail na ${BRAND_NAME}`,
		html,
		text,
	};
};
