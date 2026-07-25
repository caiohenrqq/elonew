'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getCheckoutErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import { getAuthSession } from '@/shared/auth/session';
import {
	type ChatMessageOutput,
	type ListChatMessagesResponseOutput,
	sendChatMessageInputSchema,
} from '@/shared/chat/chat-contracts';
import {
	listOrderChatMessages,
	sendOrderChatMessage,
} from '@/shared/chat/chat-service';
import { assertSameOriginRequest } from '@/shared/security/origin';
import {
	getClientDashboardOrders as getClientDashboardOrdersFromApi,
	getOrder as getOrderFromApi,
	previewOrderQuote,
	resumePaymentCheckout,
	saveOrderCredentials,
	startCheckout,
} from '../server/checkout-service';
import {
	type ClientDashboardOrdersOutput,
	type GetOrderOutput,
	type OrderQuotePreviewOutput,
	type PreviewCheckoutInput,
	previewCheckoutSchema,
	type StartCheckoutInput,
	saveOrderCredentialsSchema,
	startCheckoutSchema,
} from '../server/order-contracts';
import type { SupportTicketOutput } from '../server/ticket-contracts';
import { createSupportTicketInputSchema } from '../server/ticket-contracts';
import {
	createSupportTicket,
	listSupportTickets,
} from '../server/ticket-service';

export type CheckoutActionState = {
	checkoutUrl?: string;
	orderId?: string;
	paymentId?: string;
	error?: string;
};

export type ResumePaymentCheckoutActionState = {
	checkoutUrl?: string;
	error?: string;
};

export type SaveOrderCredentialsActionState = {
	error?: string;
	success?: string;
};

export type CreateSupportTicketActionState = {
	error?: string;
	success?: string;
};

export type QuotePreviewActionState =
	| {
			quote: OrderQuotePreviewOutput;
			error?: never;
	  }
	| {
			error: string;
			quote?: never;
	  };

export const previewOrderQuoteAction = async (
	input: PreviewCheckoutInput,
): Promise<QuotePreviewActionState> => {
	const parsed = previewCheckoutSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		return { quote: await previewOrderQuote(parsed.data, api.request) };
	} catch (error) {
		return {
			error: getCheckoutErrorMessage(error),
		};
	}
};

export const startCheckoutAction = async (
	input: StartCheckoutInput,
): Promise<CheckoutActionState> => {
	const parsed = startCheckoutSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		return await startCheckout(parsed.data, api.request);
	} catch (error) {
		return {
			error: getCheckoutErrorMessage(error),
		};
	}
};

export const getOrder = async (orderId: string): Promise<GetOrderOutput> => {
	try {
		return await getOrderFromApi(orderId, (path, init) =>
			api.request(path, { ...init, allowSessionRefresh: false }),
		);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

const credentialsErrorMap: Record<string, string> = {
	'Order credentials can only be stored after payment confirmation.':
		'Os dados da conta só podem ser enviados após a confirmação do pagamento.',
	'Order credentials password confirmation does not match.':
		'As senhas não coincidem.',
};

export const saveOrderCredentialsAction = async (
	orderId: string,
	_state: SaveOrderCredentialsActionState,
	formData: FormData,
): Promise<SaveOrderCredentialsActionState> => {
	const parsed = saveOrderCredentialsSchema.safeParse({
		login: formData.get('login'),
		summonerName: formData.get('summonerName'),
		password: formData.get('password'),
		confirmPassword: formData.get('confirmPassword'),
	});
	if (!parsed.success) {
		return {
			error: parsed.error.issues[0]?.message ?? 'Revise os dados da conta.',
		};
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		await saveOrderCredentials(orderId, parsed.data, api.request);
		revalidatePath(`/client/orders/${orderId}`);

		return { success: 'Dados da conta enviados com segurança.' };
	} catch (error) {
		if (error instanceof ApiRequestError) {
			if (error.status === 401 || error.status === 403)
				return { error: 'Entre novamente para continuar.' };
			if (error.status === 400)
				return {
					error:
						credentialsErrorMap[error.message] ??
						'Revise os dados da conta e tente novamente.',
				};
			if (error.status === 404) return { error: 'Pedido não encontrado.' };
		}

		return { error: 'Não foi possível enviar os dados da conta agora.' };
	}
};

export const getClientDashboardOrders =
	async (): Promise<ClientDashboardOrdersOutput> => {
		try {
			return await getClientDashboardOrdersFromApi((path, init) =>
				api.request(path, { ...init, allowSessionRefresh: false }),
			);
		} catch (error) {
			return redirectOnAuthError(error);
		}
	};

export const getSupportTickets = async (): Promise<SupportTicketOutput[]> => {
	try {
		return await listSupportTickets((path, init) =>
			api.request(path, { ...init, allowSessionRefresh: false }),
		);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const createSupportTicketAction = async (
	_state: CreateSupportTicketActionState,
	formData: FormData,
): Promise<CreateSupportTicketActionState> => {
	const rawOrderId = formData.get('orderId')?.toString().trim();
	const parsed = createSupportTicketInputSchema.safeParse({
		subject: formData.get('subject'),
		content: formData.get('content'),
		...(rawOrderId ? { orderId: rawOrderId } : {}),
	});
	if (!parsed.success) {
		return {
			error: parsed.error.issues[0]?.message ?? 'Revise os dados do ticket.',
		};
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		await createSupportTicket(parsed.data, api.request);

		return { success: 'Ticket enviado. O suporte vai responder em breve.' };
	} catch (error) {
		if (
			error instanceof ApiRequestError &&
			(error.status === 401 || error.status === 403)
		) {
			return { error: 'Entre novamente para continuar.' };
		}

		return { error: 'Não foi possível criar o ticket agora.' };
	}
};

export const getOrderChatMessages = async (
	orderId: string,
): Promise<ListChatMessagesResponseOutput> => {
	try {
		return await listOrderChatMessages(orderId, (path, init) =>
			api.request(path, { ...init, allowSessionRefresh: false }),
		);
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 404)
			return { items: [], nextCursor: null };

		return redirectOnAuthError(error);
	}
};

export type SendOrderChatMessageActionState =
	| {
			message: ChatMessageOutput;
			error?: never;
	  }
	| {
			error: string;
			message?: never;
	  };

export const sendOrderChatMessageAction = async (
	orderId: string,
	content: string,
): Promise<SendOrderChatMessageActionState> => {
	const parsed = sendChatMessageInputSchema.safeParse({ content });
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Mensagem inválida.' };
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		return {
			message: await sendOrderChatMessage(orderId, parsed.data, api.request),
		};
	} catch (error) {
		if (
			error instanceof ApiRequestError &&
			(error.status === 401 || error.status === 403)
		) {
			return { error: 'Entre novamente para continuar.' };
		}

		if (error instanceof ApiRequestError && error.status === 409) {
			return {
				error:
					'Este chat não está disponível para envio de mensagens neste status.',
			};
		}

		return { error: 'Não foi possível enviar a mensagem.' };
	}
};

export const resumePaymentCheckoutAction = async (
	orderId: string,
): Promise<ResumePaymentCheckoutActionState> => {
	const session = await getAuthSession();
	if (!session) redirect('/login');

	try {
		await assertSameOriginRequest();
		const payment = await resumePaymentCheckout(orderId, api.request);
		return { checkoutUrl: payment.checkoutUrl };
	} catch (error) {
		if (
			error instanceof ApiRequestError &&
			(error.status === 401 || error.status === 403)
		)
			redirect('/login');

		return {
			error: getCheckoutErrorMessage(error),
		};
	}
};
