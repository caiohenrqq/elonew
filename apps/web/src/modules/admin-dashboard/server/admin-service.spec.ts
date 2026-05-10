import { ApiRequestError } from '@/shared/api-client-management/http';
import {
	type AuthenticatedApiRequest,
	blockAdminUser,
	forceCancelAdminOrder,
	getAdminDashboard,
	getAdminMetrics,
	getAdminOrderChatMessages,
	unblockAdminUser,
} from './admin-service';

describe('admin service', () => {
	it('loads and parses the admin dashboard from API responses', async () => {
		const apiRequest = jest.fn(async <T>(path: string): Promise<T> => {
			if (path === '/admin/metrics') {
				return {
					revenueTotal: 1200,
					ordersTotal: 8,
					activeOrders: 3,
					activeUsers: 12,
				} as T;
			}
			if (path === '/admin/users?limit=25') {
				return [
					{
						id: 'user-1',
						username: 'Admin Target',
						email: 'target@example.com',
						role: 'CLIENT',
						isActive: true,
						isBlocked: false,
						createdAt: '2026-04-10T10:00:00.000Z',
					},
				] as T;
			}
			if (path === '/admin/orders?limit=25') {
				return [
					{
						id: 'order-1',
						clientId: 'client-1',
						boosterId: null,
						status: 'pending_booster',
						serviceType: 'elo_boost',
						totalAmount: 99,
						createdAt: '2026-04-10T10:00:00.000Z',
						latestGovernanceAction: null,
					},
				] as T;
			}
			if (path === '/admin/support/tickets?limit=25') {
				return [
					{
						id: 'ticket-1',
						userId: 'user-1',
						subject: 'Payment question',
						status: 'OPEN',
						createdAt: '2026-04-10T10:00:00.000Z',
						updatedAt: '2026-04-10T10:05:00.000Z',
						messageCount: 2,
						latestMessageAt: '2026-04-10T10:05:00.000Z',
					},
				] as T;
			}
			throw new Error(`Unexpected path: ${path}`);
		});

		await expect(
			getAdminDashboard(apiRequest as AuthenticatedApiRequest),
		).resolves.toEqual({
			metrics: {
				revenueTotal: 1200,
				ordersTotal: 8,
				activeOrders: 3,
				activeUsers: 12,
			},
			users: [expect.objectContaining({ id: 'user-1' })],
			orders: [expect.objectContaining({ id: 'order-1' })],
			tickets: [expect.objectContaining({ id: 'ticket-1' })],
		});
	});

	it('submits governance actions with required reason payloads', async () => {
		const apiRequest = jest.fn(async <T>(): Promise<T> => undefined as T);

		await blockAdminUser(
			{ targetId: 'user-1', reason: 'Fraud review' },
			apiRequest as AuthenticatedApiRequest,
		);
		await unblockAdminUser(
			{ targetId: 'user-1', reason: 'Review completed' },
			apiRequest as AuthenticatedApiRequest,
		);
		await forceCancelAdminOrder(
			{ targetId: 'order-1', reason: 'Payment safety review' },
			apiRequest as AuthenticatedApiRequest,
		);

		expect(apiRequest).toHaveBeenCalledWith('/admin/users/user-1/block', {
			auth: true,
			method: 'POST',
			body: JSON.stringify({ reason: 'Fraud review' }),
		});
		expect(apiRequest).toHaveBeenCalledWith('/admin/users/user-1/unblock', {
			auth: true,
			method: 'POST',
			body: JSON.stringify({ reason: 'Review completed' }),
		});
		expect(apiRequest).toHaveBeenCalledWith(
			'/admin/orders/order-1/force-cancel',
			{
				auth: true,
				method: 'POST',
				body: JSON.stringify({ reason: 'Payment safety review' }),
			},
		);
	});

	it('loads admin order chat history from the read-only admin endpoint', async () => {
		const apiRequest = jest.fn(async <T>(path: string): Promise<T> => {
			expect(path).toBe('/admin/orders/order-1/chat/messages?limit=50');
			return {
				items: [
					{
						id: 'message-1',
						orderId: 'order-1',
						chatId: 'chat-1',
						content: 'Pode começar pelo mid.',
						sender: {
							id: 'client-1',
							username: 'Client',
							role: 'CLIENT',
						},
						createdAt: '2026-05-01T10:00:00.000Z',
					},
				],
				nextCursor: null,
			} as T;
		});

		await expect(
			getAdminOrderChatMessages(
				'order-1',
				apiRequest as AuthenticatedApiRequest,
			),
		).resolves.toEqual({
			items: [expect.objectContaining({ id: 'message-1' })],
			nextCursor: null,
		});
		expect(apiRequest).toHaveBeenCalledWith(
			'/admin/orders/order-1/chat/messages?limit=50',
			{ auth: true },
		);
	});

	it('adds admin endpoint context to non-auth read failures', async () => {
		const apiRequest = jest.fn(async <T>(): Promise<T> => {
			throw new ApiRequestError(500, { message: 'Internal server error' });
		});

		await expect(
			getAdminMetrics(apiRequest as AuthenticatedApiRequest),
		).rejects.toThrow(
			'Admin metrics request failed (HTTP 500) while requesting /admin/metrics: Internal server error',
		);
	});
});
