import type {
	AdminDashboardReaderPort,
	AdminUserSnapshot,
} from '@modules/admin/application/ports/admin-dashboard-reader.port';
import { ADMIN_DASHBOARD_READER_KEY } from '@modules/admin/application/ports/admin-dashboard-reader.port';
import type { AdminGovernanceRepositoryPort } from '@modules/admin/application/ports/admin-governance.repository';
import { ADMIN_GOVERNANCE_REPOSITORY_KEY } from '@modules/admin/application/ports/admin-governance.repository';
import type { ScheduledJobsReaderPort } from '@modules/admin/application/ports/scheduled-jobs-reader.port';
import { SCHEDULED_JOBS_READER_KEY } from '@modules/admin/application/ports/scheduled-jobs-reader.port';
import type { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import type { User } from '@modules/users/domain/user.entity';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { signTestAccessToken as signToken } from './support/auth-token';
import { E2eUserRepositoryStub } from './support/e2e-user-repository.stub';

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

		async listUsers(): Promise<AdminUserSnapshot[]> {
			return [
				{
					id: 'user-1',
					username: 'Client One',
					email: 'client@example.com',
					role: Role.CLIENT,
					isActive: true,
					isBlocked: false,
					activationStatus: 'ACTIVE',
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
					summonerName: 'Invocador',
					currentLeague: 'gold',
					currentDivision: 'II',
					currentLp: 40,
					desiredLeague: 'platinum',
					desiredDivision: 'IV',
					server: 'BR',
					desiredQueue: 'solo_duo',
					lpGain: 20,
					subtotal: 99,
					totalAmount: 99,
					discountAmount: 0,
					extras: [],
					client: { username: 'Client One' },
					booster: null,
					createdAt: new Date('2026-04-10T10:00:00.000Z'),
					latestGovernanceAction: null,
					boosterPayment: null,
				},
			];
		}

		async getOrder(orderId: string) {
			return (
				(await this.listOrders()).find((order) => order.id === orderId) ?? null
			);
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
			return null;
		}

		async saveOrder(): Promise<void> {
			throw new Error('Unexpected governance repository call.');
		}

		async recordAction(): Promise<void> {
			throw new Error('Unexpected governance repository call.');
		}

		async updateUserAndRecordAction(): Promise<void> {
			throw new Error('Unexpected governance repository call.');
		}
	}

	class ScheduledJobsReaderStub implements ScheduledJobsReaderPort {
		async readQueues(queueNames: string[]) {
			return queueNames.map((queueName) => ({
				queueName,
				counts: {
					delayed: 1,
					waiting: 0,
					active: 0,
					failed: 0,
					completed: 3,
				},
				schedulers: [
					{
						name: 'reconcile_stale_checkouts',
						cron: '*/10 * * * *',
						nextRunAt: new Date('2026-07-25T12:10:00.000Z'),
					},
				],
				pending: [],
			}));
		}
	}

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(SCHEDULED_JOBS_READER_KEY)
			.useClass(ScheduledJobsReaderStub)
			.overrideProvider(ADMIN_DASHBOARD_READER_KEY)
			.useClass(AdminDashboardReaderStub)
			.overrideProvider(ADMIN_GOVERNANCE_REPOSITORY_KEY)
			.useClass(AdminGovernanceRepositoryStub)
			.overrideProvider(USER_REPOSITORY_KEY)
			.useClass(E2eUserRepositoryStub)
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
		['POST', '/admin/orders/order-1/release-booster-payment'],
		['GET', '/admin/scheduled-jobs'],
		['GET', '/admin/support/tickets'],
	])('rejects non-admin access for %s %s', async (method, path) => {
		const token = signToken({ sub: 'client-1', role: Role.CLIENT });
		const request = requestHttp(app)
			[method.toLowerCase() as 'get' | 'post'](path)
			.set('Authorization', `Bearer ${token}`);
		if (method === 'POST') request.send({ reason: 'Audit reason' });

		await request.expect(403).execute();
	});

	it('lists scheduled jobs with their cron and next run', async () => {
		const token = signToken({ sub: 'admin-1', role: Role.ADMIN });

		await requestHttp(app)
			.get('/admin/scheduled-jobs')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.expect<{
				queues: Array<{ queueName: string; schedulers: unknown[] }>;
				inProcess: Array<{ name: string }>;
			}>(({ body }) => {
				expect(body.queues.at(0)?.schedulers).toEqual([
					expect.objectContaining({
						name: 'reconcile_stale_checkouts',
						cron: '*/10 * * * *',
					}),
				]);
				expect(body.inProcess).toEqual([
					expect.objectContaining({ name: 'outbox-dispatcher' }),
				]);
			})
			.execute();
	});

	it('maps a missing order to 404 when releasing a booster payment', async () => {
		const token = signToken({ sub: 'admin-1', role: Role.ADMIN });

		await requestHttp(app)
			.post('/admin/orders/order-1/release-booster-payment')
			.set('Authorization', `Bearer ${token}`)
			.send({ reason: 'Cliente confirmou o boost' })
			.expect(404)
			.expect<{ message: string }>(({ body }) => {
				expect(body.message).toBe('Admin target order not found.');
			})
			.execute();
	});

	it('rejects a booster payment release without a reason', async () => {
		const token = signToken({ sub: 'admin-1', role: Role.ADMIN });

		await requestHttp(app)
			.post('/admin/orders/order-1/release-booster-payment')
			.set('Authorization', `Bearer ${token}`)
			.send({ reason: ' ' })
			.expect(400)
			.execute();
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
