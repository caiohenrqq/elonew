'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { api } from '@/shared/api-client-management/api-client';
import { getAuthErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import type { AuthSession } from '@/shared/auth/session';
import { getAuthSession } from '@/shared/auth/session';
import { assertSameOriginRequest } from '@/shared/security/origin';
import type {
	AdminDashboardOutput,
	AdminMetricsOutput,
	AdminOrderOutput,
	AdminSupportTicketOutput,
	AdminUserOutput,
} from '../server/admin-contracts';
import {
	blockAdminUser,
	forceCancelAdminOrder,
	getAdminDashboard as getAdminDashboardFromApi,
	getAdminMetrics as getAdminMetricsFromApi,
	getAdminOrders as getAdminOrdersFromApi,
	getAdminSupportTickets as getAdminSupportTicketsFromApi,
	getAdminUsers as getAdminUsersFromApi,
	unblockAdminUser,
} from '../server/admin-service';

export type AdminGovernanceActionState = {
	error?: string;
	success?: boolean;
};

const governanceFormSchema = z.object({
	targetId: z.string().trim().min(1),
	reason: z.string().trim().min(1).max(500),
});

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
	governanceFormSchema.parse({
		targetId: formData.get('targetId'),
		reason: formData.get('reason'),
	});

export const getAdminDashboard = async (): Promise<AdminDashboardOutput> => {
	await getAdminSessionOrRedirect();
	try {
		return await getAdminDashboardFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
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
