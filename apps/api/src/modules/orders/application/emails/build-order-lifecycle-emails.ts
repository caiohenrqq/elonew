import {
	BRAND_NAME,
	buildBrandedEmailHtml,
	escapeHtml,
	MUTED_TEXT_COLOR,
	TEXT_COLOR,
} from '@app/common/email/build-branded-email';
import type { SendEmailInput } from '@app/common/email/ports/email-sender.port';

type OrderLifecycleEmailInput = {
	orderId: string;
	orderUrl: string;
	route: string | null;
};

type OrderLifecycleEmailContent = Pick<
	SendEmailInput,
	'subject' | 'html' | 'text'
>;

type OrderLifecycleEmailCopy = {
	subject: string;
	title: string;
	message: string;
	ctaLabel: string;
};

const buildOrderLifecycleEmail = (
	input: OrderLifecycleEmailInput,
	copy: OrderLifecycleEmailCopy,
): OrderLifecycleEmailContent => {
	const routeLine = input.route
		? `<p style="margin:12px 0 0;color:${TEXT_COLOR};font-size:14px;font-weight:bold;">${escapeHtml(input.route)}</p>`
		: '';

	const html = buildBrandedEmailHtml({
		title: copy.title,
		contentHtml: `<p style="margin:0;color:${MUTED_TEXT_COLOR};font-size:14px;line-height:1.6;">${escapeHtml(copy.message)}</p>
								${routeLine}
								<p style="margin:12px 0 0;color:${MUTED_TEXT_COLOR};font-size:12px;line-height:1.6;">Pedido <span style="color:${TEXT_COLOR};font-family:monospace;">${escapeHtml(input.orderId)}</span></p>`,
		ctaLabel: copy.ctaLabel,
		ctaUrl: input.orderUrl,
		footerText: `Você recebeu este e-mail porque tem um pedido ativo na ${BRAND_NAME}.`,
	});

	const text = [
		copy.message,
		...(input.route ? [input.route] : []),
		`Pedido ${input.orderId}`,
		'',
		`Acompanhe seu pedido: ${input.orderUrl}`,
	].join('\n');

	return { subject: copy.subject, html, text };
};

export const buildOrderPaidEmail = (
	input: OrderLifecycleEmailInput,
): OrderLifecycleEmailContent =>
	buildOrderLifecycleEmail(input, {
		subject: `Pagamento confirmado na ${BRAND_NAME}`,
		title: 'Pagamento confirmado',
		message:
			'Recebemos o pagamento do seu pedido. Agora é só aguardar: um booster vai assumir o serviço em breve.',
		ctaLabel: 'Acompanhar pedido',
	});

export const buildOrderBoosterAssignedEmail = (
	input: OrderLifecycleEmailInput,
): OrderLifecycleEmailContent =>
	buildOrderLifecycleEmail(input, {
		subject: `Um booster assumiu seu pedido na ${BRAND_NAME}`,
		title: 'Booster a caminho',
		message:
			'Um booster acabou de assumir o seu pedido e o chat já está aberto. Fale com ele para alinhar os detalhes.',
		ctaLabel: 'Abrir chat do pedido',
	});
