import type { OrderStatus } from '@modules/orders/domain/order-status';
import type { Role } from '@packages/auth/roles/role';

export const ADMIN_DASHBOARD_READER_KEY = Symbol('ADMIN_DASHBOARD_READER_KEY');

export type AdminMetricsSnapshot = {
	revenueTotal: number;
	ordersTotal: number;
	activeOrders: number;
	activeUsers: number;
};

export type AdminUserSnapshot = {
	id: string;
	username: string;
	email: string;
	role: Role;
	isActive: boolean;
	isBlocked: boolean;
	createdAt: Date;
};

export type AdminOrderSnapshot = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	status: OrderStatus;
	serviceType: string | null;
	totalAmount: number | null;
	createdAt: Date;
	latestGovernanceAction: {
		type: string;
		reason: string;
		createdAt: Date;
	} | null;
};

export type AdminSupportTicketSnapshot = {
	id: string;
	userId: string;
	subject: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	messageCount: number;
	latestMessageAt: Date | null;
};

export interface AdminDashboardReaderPort {
	getMetrics(): Promise<AdminMetricsSnapshot>;
	listUsers(input: {
		query?: string;
		limit: number;
	}): Promise<AdminUserSnapshot[]>;
	listOrders(input: { limit: number }): Promise<AdminOrderSnapshot[]>;
	listSupportTickets(input: {
		limit: number;
	}): Promise<AdminSupportTicketSnapshot[]>;
}
