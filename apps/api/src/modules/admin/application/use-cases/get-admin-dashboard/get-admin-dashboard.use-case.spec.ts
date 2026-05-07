import {
	type AdminDashboardReaderPort,
	type AdminMetricsSnapshot,
	type AdminOrderSnapshot,
	type AdminSupportTicketSnapshot,
	type AdminUserSnapshot,
} from '@modules/admin/application/ports/admin-dashboard-reader.port';
import { GetAdminDashboardUseCase } from '@modules/admin/application/use-cases/get-admin-dashboard/get-admin-dashboard.use-case';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Role } from '@packages/auth/roles/role';

class AdminDashboardReaderStub implements AdminDashboardReaderPort {
	metrics: AdminMetricsSnapshot = {
		revenueTotal: 700,
		ordersTotal: 3,
		activeOrders: 2,
		activeUsers: 4,
	};
	users: AdminUserSnapshot[] = [
		{
			id: 'client-1',
			username: 'Client',
			email: 'client@example.com',
			role: Role.CLIENT,
			isActive: true,
			isBlocked: false,
			createdAt: new Date('2026-05-01T00:00:00.000Z'),
		},
	];
	orders: AdminOrderSnapshot[] = [
		{
			id: 'order-1',
			clientId: 'client-1',
			boosterId: null,
			status: OrderStatus.PENDING_BOOSTER,
			serviceType: 'ELO_BOOST',
			totalAmount: 300,
			createdAt: new Date('2026-05-01T00:00:00.000Z'),
			latestGovernanceAction: null,
		},
	];
	tickets: AdminSupportTicketSnapshot[] = [
		{
			id: 'ticket-1',
			userId: 'client-1',
			subject: 'Payment issue',
			status: 'OPEN',
			createdAt: new Date('2026-05-01T00:00:00.000Z'),
			updatedAt: new Date('2026-05-02T00:00:00.000Z'),
			messageCount: 2,
			latestMessageAt: new Date('2026-05-02T00:00:00.000Z'),
		},
	];

	getMetrics(): Promise<AdminMetricsSnapshot> {
		return Promise.resolve(this.metrics);
	}

	listUsers(): Promise<AdminUserSnapshot[]> {
		return Promise.resolve(this.users);
	}

	listOrders(): Promise<AdminOrderSnapshot[]> {
		return Promise.resolve(this.orders);
	}

	listSupportTickets(): Promise<AdminSupportTicketSnapshot[]> {
		return Promise.resolve(this.tickets);
	}
}

describe('GetAdminDashboardUseCase', () => {
	it('returns admin financial and operational metrics', async () => {
		const useCase = new GetAdminDashboardUseCase(
			new AdminDashboardReaderStub(),
		);

		await expect(useCase.getMetrics()).resolves.toEqual({
			revenueTotal: 700,
			ordersTotal: 3,
			activeOrders: 2,
			activeUsers: 4,
		});
	});

	it('returns user management rows', async () => {
		const useCase = new GetAdminDashboardUseCase(
			new AdminDashboardReaderStub(),
		);

		await expect(useCase.listUsers({ limit: 10 })).resolves.toHaveLength(1);
	});

	it('returns order governance rows', async () => {
		const useCase = new GetAdminDashboardUseCase(
			new AdminDashboardReaderStub(),
		);

		await expect(useCase.listOrders({ limit: 10 })).resolves.toEqual([
			expect.objectContaining({
				id: 'order-1',
				status: OrderStatus.PENDING_BOOSTER,
			}),
		]);
	});

	it('returns support ticket summaries', async () => {
		const useCase = new GetAdminDashboardUseCase(
			new AdminDashboardReaderStub(),
		);

		await expect(useCase.listSupportTickets({ limit: 10 })).resolves.toEqual([
			expect.objectContaining({
				id: 'ticket-1',
				messageCount: 2,
			}),
		]);
	});
});
