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
	activationStatus: 'ACTIVE' | 'PENDING_ACTIVATION' | 'INACTIVE';
	createdAt: Date;
};

export type AdminOrderSnapshot = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	status: OrderStatus;
	serviceType: string | null;
	summonerName: string | null;
	currentLeague: string | null;
	currentDivision: string | null;
	currentLp: number | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
	server: string | null;
	desiredQueue: string | null;
	lpGain: number | null;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
	extras: Array<{ type: string; price: number }>;
	client: { username: string } | null;
	booster: { username: string } | null;
	createdAt: Date;
	latestGovernanceAction: {
		type: string;
		reason: string;
		createdAt: Date;
	} | null;
	boosterPayment: {
		amount: number;
		availableAt: Date;
		releasedAt: Date | null;
		releasedBy: 'schedule' | 'admin' | null;
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
	getOrder(orderId: string): Promise<AdminOrderSnapshot | null>;
	listSupportTickets(input: {
		limit: number;
	}): Promise<AdminSupportTicketSnapshot[]>;
}
