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
	AdminCreateUserInput,
	AdminDashboardOutput,
	AdminGovernanceInput,
	AdminMetricsOutput,
	AdminOrderOutput,
	AdminSupportTicketOutput,
	AdminUserOutput,
} from '../server/admin-contracts';
import {
	adminChangeUserRoleInputSchema,
	adminCreateUserInputSchema,
	adminGovernanceInputSchema,
	adminRenameUserInputSchema,
} from '../server/admin-contracts';
import {
	blockAdminUser,
	changeAdminUserRole,
	createAdminUser,
	forceCancelAdminOrder,
	getAdminDashboard as getAdminDashboardFromApi,
	getAdminMetrics as getAdminMetricsFromApi,
	getAdminOrderChatMessages as getAdminOrderChatMessagesFromApi,
	getAdminOrders as getAdminOrdersFromApi,
	getAdminSupportTickets as getAdminSupportTicketsFromApi,
	getAdminUsers as getAdminUsersFromApi,
	renameAdminUser,
	resendAdminUserPasswordSetup,
	unblockAdminUser,
} from '../server/admin-service';

export type AdminGovernanceActionState = {
	error?: string;
	success?: boolean;
};

export type AdminCreateUserActionState = AdminGovernanceActionState;

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

const parseCreateUserForm = (formData: FormData) =>
	adminCreateUserInputSchema.parse({
		username: formData.get('username'),
		email: formData.get('email'),
		role: formData.get('role'),
	}) satisfies AdminCreateUserInput;

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

export const createAdminUserAction = async (
	_state: AdminCreateUserActionState,
	formData: FormData,
): Promise<AdminCreateUserActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await createAdminUser(parseCreateUserForm(formData), api.request);
		revalidatePath('/admin');
		revalidatePath('/admin/users');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const renameAdminUserAction = async (
	_state: AdminGovernanceActionState,
	formData: FormData,
): Promise<AdminGovernanceActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await renameAdminUser(
			adminRenameUserInputSchema.parse({
				targetId: formData.get('targetId'),
				username: formData.get('username'),
			}),
			api.request,
		);
		revalidatePath('/admin');
		revalidatePath('/admin/users');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const changeAdminUserRoleAction = async (
	_state: AdminGovernanceActionState,
	formData: FormData,
): Promise<AdminGovernanceActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		await changeAdminUserRole(
			adminChangeUserRoleInputSchema.parse({
				targetId: formData.get('targetId'),
				role: formData.get('role'),
			}),
			api.request,
		);
		revalidatePath('/admin');
		revalidatePath('/admin/users');
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
	}
};

export const resendAdminUserPasswordSetupAction = async (
	_state: AdminGovernanceActionState,
	formData: FormData,
): Promise<AdminGovernanceActionState> => {
	try {
		await assertSameOriginRequest();
		await getAdminSessionOrRedirect();
		const targetId = String(formData.get('targetId') ?? '').trim();
		if (!targetId) return { error: 'Usuário inválido.' };
		await resendAdminUserPasswordSetup(targetId, api.request);
		return { success: true };
	} catch (error) {
		return { error: getAuthErrorMessage(error) };
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
