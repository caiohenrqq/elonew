import {
	BRAND_NAME,
	buildBrandedEmailHtml,
	escapeHtml,
	MUTED_TEXT_COLOR,
	TEXT_COLOR,
} from '@app/common/email/build-branded-email';
import type { SendEmailInput } from '@app/common/email/ports/email-sender.port';

type PasswordSetupEmailInput = {
	username: string;
	setupUrl: string;
	expiresInMinutes: number;
};

type PasswordSetupEmailContent = Pick<
	SendEmailInput,
	'subject' | 'html' | 'text'
>;

export const buildPasswordSetupEmail = (
	input: PasswordSetupEmailInput,
): PasswordSetupEmailContent => {
	const username = escapeHtml(input.username);
	const footerText = `Este link expira em ${input.expiresInMinutes} minutos. Se você não esperava este acesso, ignore este e-mail.`;

	const html = buildBrandedEmailHtml({
		title: 'Defina sua senha',
		contentHtml: `<p style="margin:0;color:${MUTED_TEXT_COLOR};font-size:14px;line-height:1.6;">
									Olá, <strong style="color:${TEXT_COLOR};">${username}</strong>. Sua conta na ${BRAND_NAME} foi criada por um administrador. Clique no botão abaixo para definir sua senha e ativar seu acesso.
								</p>`,
		ctaLabel: 'Definir senha',
		ctaUrl: input.setupUrl,
		showLinkFallback: true,
		footerText,
	});

	const text = [
		`Olá, ${input.username}.`,
		'',
		`Defina sua senha na ${BRAND_NAME} acessando o link abaixo:`,
		input.setupUrl,
		'',
		footerText,
	].join('\n');

	return {
		subject: `Defina sua senha na ${BRAND_NAME}`,
		html,
		text,
	};
};
