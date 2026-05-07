import { ApiRequestError } from '@/shared/api-client-management/http';
import {
	type AdminDashboardOutput,
	type AdminMetricsOutput,
	type AdminOrderOutput,
	type AdminSupportTicketOutput,
	type AdminUserOutput,
	adminDashboardSchema,
	adminGovernanceInputSchema,
	adminMetricsSchema,
	adminOrderSchema,
	adminSupportTicketSchema,
	adminUserSchema,
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

export const getAdminSupportTickets = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<AdminSupportTicketOutput[]> => {
	const path = '/admin/support/tickets?limit=25';
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
