import { ApiRequestError } from '@/shared/api-client-management/http';
import type { ListChatMessagesResponseOutput } from '@/shared/chat/chat-contracts';
import { listAdminOrderChatMessages } from '@/shared/chat/chat-service';
import {
	type AdminDashboardOutput,
	type AdminMetricsOutput,
	type AdminOrderOutput,
	type AdminSupportTicketOutput,
	type AdminTicketDetailOutput,
	type AdminUserOutput,
	adminDashboardSchema,
	adminGovernanceInputSchema,
	adminMetricsSchema,
	adminOrderSchema,
	adminSupportTicketSchema,
	adminTicketDetailSchema,
	adminUserSchema,
	type ListAdminTicketsInput,
	listAdminTicketsInputSchema,
	replyAdminTicketInputSchema,
	updateAdminTicketStatusInputSchema,
} from './admin-contracts';

export type AuthenticatedApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => Promise<T>;

const withAdminReadErrorContext = async <T>(
	label: string,
	path: string,
	load: () => Promise<T>,
): Promise<T> => {
	try {
		return await load();
	} catch (error) {
		if (
			error instanceof ApiRequestError &&
			(error.status === 401 || error.status === 403)
		) {
			throw error;
		}

		if (error instanceof ApiRequestError) {
			throw new Error(
				`${label} failed (HTTP ${error.status}) while requesting ${path}: ${error.message}`,
			);
		}

		if (error instanceof Error) {
			throw new Error(
				`${label} failed while requesting ${path}: ${error.message}`,
			);
		}

		throw new Error(`${label} failed while requesting ${path}.`);
	}
};

export const getAdminMetrics = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminMetricsOutput> => {
	const path = '/admin/metrics';
	return await withAdminReadErrorContext(
		'Admin metrics request',
		path,
		async () => {
			const response = await apiRequest<unknown>(path, { auth: true });
			return adminMetricsSchema.parse(response);
		},
	);
};

export const getAdminUsers = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminUserOutput[]> => {
	const path = '/admin/users?limit=25';
	return await withAdminReadErrorContext(
		'Admin users request',
		path,
		async () => {
			const response = await apiRequest<unknown>(path, {
				auth: true,
			});
			return adminUserSchema.array().parse(response);
		},
	);
};

export const getAdminOrders = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminOrderOutput[]> => {
	const path = '/admin/orders?limit=25';
	return await withAdminReadErrorContext(
		'Admin orders request',
		path,
		async () => {
			const response = await apiRequest<unknown>(path, {
				auth: true,
			});
			return adminOrderSchema.array().parse(response);
		},
	);
};

export const getAdminOrderChatMessages = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<ListChatMessagesResponseOutput> => {
	const path = `/admin/orders/${encodeURIComponent(orderId)}/chat/messages?limit=50`;
	return await withAdminReadErrorContext(
		'Admin order chat request',
		path,
		async () => {
			return await listAdminOrderChatMessages(orderId, apiRequest);
		},
	);
};

export const getAdminSupportTickets = async (
	apiRequest: AuthenticatedApiRequest,
	input: Partial<ListAdminTicketsInput> = {},
): Promise<AdminSupportTicketOutput[]> => {
	const params = listAdminTicketsInputSchema.parse({ limit: 25, ...input });
	const searchParams = new URLSearchParams({
		limit: String(params.limit),
	});
	if (params.status) searchParams.set('status', params.status);
	if (params.query) searchParams.set('query', params.query);

	const path = `/admin/tickets?${searchParams.toString()}`;
	return await withAdminReadErrorContext(
		'Admin support tickets request',
		path,
		async () => {
			const response = await apiRequest<unknown>(path, {
				auth: true,
			});
			return adminSupportTicketSchema.array().parse(response);
		},
	);
};

export const getAdminTicket = async (
	ticketId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminTicketDetailOutput> => {
	const path = `/admin/tickets/${encodeURIComponent(ticketId)}`;
	return await withAdminReadErrorContext(
		'Admin ticket request',
		path,
		async () => {
			const response = await apiRequest<unknown>(path, {
				auth: true,
			});
			return adminTicketDetailSchema.parse(response);
		},
	);
};

export const getAdminDashboard = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminDashboardOutput> => {
	const [metrics, users, orders, tickets] = await Promise.all([
		getAdminMetrics(apiRequest),
		getAdminUsers(apiRequest),
		getAdminOrders(apiRequest),
		getAdminSupportTickets(apiRequest),
	]);

	return adminDashboardSchema.parse({ metrics, users, orders, tickets });
};

export const blockAdminUser = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	const body = adminGovernanceInputSchema.parse(input);
	await apiRequest(`/admin/users/${encodeURIComponent(body.targetId)}/block`, {
		auth: true,
		method: 'POST',
		body: JSON.stringify({ reason: body.reason }),
	});
};

export const unblockAdminUser = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	const body = adminGovernanceInputSchema.parse(input);
	await apiRequest(
		`/admin/users/${encodeURIComponent(body.targetId)}/unblock`,
		{
			auth: true,
			method: 'POST',
			body: JSON.stringify({ reason: body.reason }),
		},
	);
};

export const forceCancelAdminOrder = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	const body = adminGovernanceInputSchema.parse(input);
	await apiRequest(
		`/admin/orders/${encodeURIComponent(body.targetId)}/force-cancel`,
		{
			auth: true,
			method: 'POST',
			body: JSON.stringify({ reason: body.reason }),
		},
	);
};

export const replyAdminTicket = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminTicketDetailOutput> => {
	const body = replyAdminTicketInputSchema.parse(input);
	const path = `/admin/tickets/${encodeURIComponent(body.ticketId)}/messages`;
	const response = await apiRequest<unknown>(path, {
		auth: true,
		method: 'POST',
		body: JSON.stringify({ content: body.content }),
	});
	return adminTicketDetailSchema.parse(response);
};

export const updateAdminTicketStatus = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminTicketDetailOutput> => {
	const body = updateAdminTicketStatusInputSchema.parse(input);
	const path = `/admin/tickets/${encodeURIComponent(body.ticketId)}/status`;
	const response = await apiRequest<unknown>(path, {
		auth: true,
		method: 'PATCH',
		body: JSON.stringify({ status: body.status }),
	});
	return adminTicketDetailSchema.parse(response);
};
