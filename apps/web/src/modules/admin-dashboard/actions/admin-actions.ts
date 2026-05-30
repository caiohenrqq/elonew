'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getAuthErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import type { AuthSession } from '@/shared/auth/session';
import { getAuthSession } from '@/shared/auth/session';
import type { ListChatMessagesResponseOutput } from '@/shared/chat/chat-contracts';
import { assertSameOriginRequest } from '@/shared/security/origin';
import type {
	AdminDashboardOutput,
	AdminGovernanceInput,
	AdminMetricsOutput,
	AdminOrderOutput,
	AdminSupportTicketOutput,
	AdminTicketDetailOutput,
	AdminUserOutput,
	ListAdminTicketsInput,
} from '../server/admin-contracts';
import {
	adminGovernanceInputSchema,
	replyAdminTicketInputSchema,
	updateAdminTicketStatusInputSchema,
} from '../server/admin-contracts';
import {
	blockAdminUser,
	forceCancelAdminOrder,
	getAdminDashboard as getAdminDashboardFromApi,
	getAdminMetrics as getAdminMetricsFromApi,
	getAdminOrderChatMessages as getAdminOrderChatMessagesFromApi,
	getAdminOrders as getAdminOrdersFromApi,
	getAdminSupportTickets as getAdminSupportTicketsFromApi,
	getAdminTicket as getAdminTicketFromApi,
	getAdminUsers as getAdminUsersFromApi,
	replyAdminTicket,
	unblockAdminUser,
	updateAdminTicketStatus,
} from '../server/admin-service';

export type AdminGovernanceActionState = {
	error?: string;
	success?: boolean;
};

export type AdminTicketActionState = {
	error?: string;
	success?: boolean;
};

const getAdminSessionOrRedirect = async () => {
	const session = await getAuthSession();
	if (!session || session.userRole !== 'ADMIN' || !session.userId)
		redirect('/login');
	return session as AuthSession & { userId: string };
};

const renderReadApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => api.request<T>(path, { ...init, allowSessionRefresh: false });

const parseGovernanceForm = (formData: FormData) =>
	adminGovernanceInputSchema.parse({
		targetId: formData.get('targetId'),
		reason: formData.get('reason'),
	}) satisfies AdminGovernanceInput;

const getValidationMessage = (error: unknown) => {
	if (
		error &&
		typeof error === 'object' &&
		'issues' in error &&
		Array.isArray(error.issues)
	) {
		const [issue] = error.issues;
		if (
			issue &&
			typeof issue === 'object' &&
			'message' in issue &&
			typeof issue.message === 'string'
		) {
			return issue.message;
		}
	}

	return getAuthErrorMessage(error);
};

export const getAdminDashboard = async (): Promise<AdminDashboardOutput> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminDashboardFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getAdminUserId = async () => {
	const session = await getAdminSessionOrRedirect();
	return session.userId;
};

export const getAdminMetrics = async (): Promise<AdminMetricsOutput> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminMetricsFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getAdminUsers = async (): Promise<AdminUserOutput[]> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminUsersFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getAdminOrders = async (): Promise<AdminOrderOutput[]> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminOrdersFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getAdminOrderChatMessages = async (
	orderId: string,
): Promise<ListChatMessagesResponseOutput> => {
	await getAdminSessionOrRedirect();

	try {
		return await getAdminOrderChatMessagesFromApi(
			orderId,
			renderReadApiRequest,
		);
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 404)
			return { items: [], nextCursor: null };

		return redirectOnAuthError(error);
	}
};

export const getAdminSupportTickets = async (): Promise<
	AdminSupportTicketOutput[]
> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminSupportTicketsFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getAdminSupportWorkspace = async (
	input: Partial<ListAdminTicketsInput> & { ticketId?: string } = {},
): Promise<{
	tickets: AdminSupportTicketOutput[];
	selectedTicket: AdminTicketDetailOutput | null;
}> => {
	await getAdminSessionOrRedirect();
	try {
		const selectedTicketId = input.ticketId?.trim();
		const tickets = await getAdminSupportTicketsFromApi(renderReadApiRequest, {
			limit: input.limit ?? 25,
			status: input.status,
			query: input.query,
		});
		const fallbackTicketId = selectedTicketId || tickets[0]?.id;
		if (!fallbackTicketId) return { tickets, selectedTicket: null };

		try {
			return {
				tickets,
				selectedTicket: await getAdminTicketFromApi(
					fallbackTicketId,
					renderReadApiRequest,
				),
			};
		} catch (error) {
			if (error instanceof ApiRequestError && error.status === 404) {
				return { tickets, selectedTicket: null };
			}

			throw error;
		}
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const blockAdminUserAction = async (
	_state: AdminGovernanceActionState,
	formData: FormData,
): Promise<AdminGovernanceActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await blockAdminUser(parseGovernanceForm(formData), api.request);
		revalidatePath('/admin');
		revalidatePath('/admin/users');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const replyAdminTicketAction = async (
	_state: AdminTicketActionState,
	formData: FormData,
): Promise<AdminTicketActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();

		const input = replyAdminTicketInputSchema.parse({
			ticketId: formData.get('ticketId'),
			content: formData.get('content'),
		});

		await replyAdminTicket(input, api.request);
		revalidatePath('/admin');
		revalidatePath('/admin/support');
		return { success: true };
	} catch (error) {
		return { error: getValidationMessage(error) };
	}
};

export const updateAdminTicketStatusAction = async (
	_state: AdminTicketActionState,
	formData: FormData,
): Promise<AdminTicketActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();

		const input = updateAdminTicketStatusInputSchema.parse({
			ticketId: formData.get('ticketId'),
			status: formData.get('status'),
		});

		await updateAdminTicketStatus(input, api.request);
		revalidatePath('/admin');
		revalidatePath('/admin/support');
		return { success: true };
	} catch (error) {
		return { error: getValidationMessage(error) };
	}
};

export const unblockAdminUserAction = async (
	_state: AdminGovernanceActionState,
	formData: FormData,
): Promise<AdminGovernanceActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await unblockAdminUser(parseGovernanceForm(formData), api.request);
		revalidatePath('/admin');
		revalidatePath('/admin/users');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const forceCancelAdminOrderAction = async (
	_state: AdminGovernanceActionState,
	formData: FormData,
): Promise<AdminGovernanceActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await forceCancelAdminOrder(parseGovernanceForm(formData), api.request);
		revalidatePath('/admin');
		revalidatePath('/admin/orders');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};
