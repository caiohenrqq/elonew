import { createHmac } from 'node:crypto';
import type { AdminDashboardReaderPort } from '@modules/admin/application/ports/admin-dashboard-reader.port';
import { ADMIN_DASHBOARD_READER_KEY } from '@modules/admin/application/ports/admin-dashboard-reader.port';
import type { AdminGovernanceRepositoryPort } from '@modules/admin/application/ports/admin-governance.repository';
import { ADMIN_GOVERNANCE_REPOSITORY_KEY } from '@modules/admin/application/ports/admin-governance.repository';
import type { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type { User } from '@modules/users/domain/user.entity';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';

describe('Admin dashboard (e2e)', () => {
	let app: ApiHttpApp;

	class AdminDashboardReaderStub implements AdminDashboardReaderPort {
		async getMetrics() {
			return {
				revenueTotal: 500,
				ordersTotal: 4,
				activeOrders: 2,
				activeUsers: 3,
			};
		}

		async listUsers() {
			return [
				{
					id: 'user-1',
					username: 'Client One',
					email: 'client@example.com',
					role: Role.CLIENT,
					isActive: true,
					isBlocked: false,
					createdAt: new Date('2026-04-10T10:00:00.000Z'),
				},
			];
		}

		async listOrders() {
			return [
				{
					id: 'order-1',
					clientId: 'client-1',
					boosterId: null,
					status: OrderStatus.PENDING_BOOSTER,
					serviceType: 'elo_boost',
					totalAmount: 99,
					createdAt: new Date('2026-04-10T10:00:00.000Z'),
					latestGovernanceAction: null,
				},
			];
		}

		async listSupportTickets() {
			return [
				{
					id: 'ticket-1',
					userId: 'user-1',
					subject: 'Payment question',
					status: 'OPEN',
					createdAt: new Date('2026-04-10T10:00:00.000Z'),
					updatedAt: new Date('2026-04-10T10:05:00.000Z'),
					messageCount: 2,
					latestMessageAt: new Date('2026-04-10T10:05:00.000Z'),
				},
			];
		}
	}

	class AdminGovernanceRepositoryStub implements AdminGovernanceRepositoryPort {
		async findUserById(): Promise<User | null> {
			throw new Error('Unexpected governance repository call.');
		}

		async saveUser(): Promise<void> {
			throw new Error('Unexpected governance repository call.');
		}

		async findOrderById(): Promise<Order | null> {
			throw new Error('Unexpected governance repository call.');
		}

		async saveOrder(): Promise<void> {
			throw new Error('Unexpected governance repository call.');
		}

		async recordAction(): Promise<void> {
			throw new Error('Unexpected governance repository call.');
		}
	}

	function getJwtSecret(): string {
		return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';
	}

	function signToken(payload: Record<string, unknown>): string {
		const now = Math.floor(Date.now() / 1000);
		const header = Buffer.from(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		).toString('base64url');
		const body = Buffer.from(
			JSON.stringify({
				issuedAt: now,
				expiresAt: now + 900,
				...payload,
			}),
		).toString('base64url');
		const signature = createHmac('sha256', getJwtSecret())
			.update(`${header}.${body}`)
			.digest('base64url');

		return `${header}.${body}.${signature}`;
	}

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(ADMIN_DASHBOARD_READER_KEY)
			.useClass(AdminDashboardReaderStub)
			.overrideProvider(ADMIN_GOVERNANCE_REPOSITORY_KEY)
			.useClass(AdminGovernanceRepositoryStub)
			.compile();

		app = await createTestHttpApp(moduleRef);
	});

	afterEach(async () => {
		await app.close();
	});

	it('allows admins to read dashboard resources', async () => {
		const token = signToken({ sub: 'admin-1', role: Role.ADMIN });

		await requestHttp(app)
			.get('/admin/metrics')
			.set('Authorization', `Bearer ${token}`)
			.expect(200, {
				revenueTotal: 500,
				ordersTotal: 4,
				activeOrders: 2,
				activeUsers: 3,
			})
			.execute();

		await requestHttp(app)
			.get('/admin/users')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.expect<Array<{ id: string }>>(({ body }) => {
				expect(body).toEqual([expect.objectContaining({ id: 'user-1' })]);
			})
			.execute();

		await requestHttp(app)
			.get('/admin/orders')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.expect<Array<{ id: string }>>(({ body }) => {
				expect(body).toEqual([expect.objectContaining({ id: 'order-1' })]);
			})
			.execute();

		await requestHttp(app)
			.get('/admin/support/tickets')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.expect<Array<{ id: string }>>(({ body }) => {
				expect(body).toEqual([expect.objectContaining({ id: 'ticket-1' })]);
			})
			.execute();
	});

	it.each([
		['GET', '/admin/metrics'],
		['GET', '/admin/users'],
		['POST', '/admin/users/user-1/block'],
		['POST', '/admin/users/user-1/unblock'],
		['GET', '/admin/orders'],
		['POST', '/admin/orders/order-1/force-cancel'],
		['GET', '/admin/support/tickets'],
	])('rejects non-admin access for %s %s', async (method, path) => {
		const token = signToken({ sub: 'client-1', role: Role.CLIENT });
		const request = requestHttp(app)
			[method.toLowerCase() as 'get' | 'post'](path)
			.set('Authorization', `Bearer ${token}`);
		if (method === 'POST') request.send({ reason: 'Audit reason' });

		await request.expect(403).execute();
	});

	it('rejects invalid governance reason payloads', async () => {
		const token = signToken({ sub: 'admin-1', role: Role.ADMIN });

		await requestHttp(app)
			.post('/admin/users/user-1/block')
			.set('Authorization', `Bearer ${token}`)
			.send({ reason: ' ' })
			.expect(400)
			.execute();
	});
});
