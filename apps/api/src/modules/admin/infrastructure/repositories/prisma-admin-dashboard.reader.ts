import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	AdminMetricsSnapshot,
	AdminOrderSnapshot,
	AdminSupportTicketSnapshot,
	AdminUserSnapshot,
} from '@modules/admin/application/ports/admin-dashboard-reader.port';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { ensurePersistedEnum } from '@packages/shared/utils/enum.utils';

type AdminUserRecord = {
	id: string;
	username: string;
	email: string;
	role: string;
	isActive: boolean;
	isBlocked: boolean;
	emailConfirmedAt: Date | null;
	createdAt: Date;
};

type AdminOrderRecord = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	status: string;
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
	adminGovernanceActions: Array<{
		actionType: string;
		reason: string;
		createdAt: Date;
	}>;
	walletTransactions: Array<{
		amount: number;
		availableAt: Date;
		releasedAt: Date | null;
		releasedBy: 'SCHEDULE' | 'ADMIN' | null;
	}>;
};

type AdminTicketRecord = {
	id: string;
	userId: string;
	subject: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	messages: Array<{ createdAt: Date }>;
	_count: { messages: number };
};

type AdminDashboardPrismaClient = {
	user: {
		count(args: {
			where?: { isActive?: boolean; isBlocked?: boolean };
		}): Promise<number>;
		findMany(args: {
			where?: {
				OR: Array<{
					username?: { contains: string; mode: 'insensitive' };
					email?: { contains: string; mode: 'insensitive' };
				}>;
			};
			select: {
				id: true;
				username: true;
				email: true;
				role: true;
				isActive: true;
				isBlocked: true;
				emailConfirmedAt: true;
				createdAt: true;
			};
			orderBy: { createdAt: 'desc' };
			take: number;
		}): Promise<AdminUserRecord[]>;
	};
	order: {
		count(args?: { where?: { status: { in: string[] } } }): Promise<number>;
		findMany(args: {
			select: {
				id: true;
				clientId: true;
				boosterId: true;
				status: true;
				serviceType: true;
				summonerName: true;
				currentLeague: true;
				currentDivision: true;
				currentLp: true;
				desiredLeague: true;
				desiredDivision: true;
				server: true;
				desiredQueue: true;
				lpGain: true;
				subtotal: true;
				totalAmount: true;
				discountAmount: true;
				extras: { select: { type: true; price: true } };
				client: { select: { username: true } };
				booster: { select: { username: true } };
				createdAt: true;
				adminGovernanceActions: {
					select: { actionType: true; reason: true; createdAt: true };
					orderBy: { createdAt: 'desc' };
					take: 1;
				};
				walletTransactions: {
					where: { type: 'CREDIT'; reason: 'order_completion' };
					select: {
						amount: true;
						availableAt: true;
						releasedAt: true;
						releasedBy: true;
					};
					orderBy: { createdAt: 'desc' };
					take: 1;
				};
			};
			orderBy: { createdAt: 'desc' };
			take: number;
		}): Promise<AdminOrderRecord[]>;
		findUnique(args: {
			where: { id: string };
			select: {
				id: true;
				clientId: true;
				boosterId: true;
				status: true;
				serviceType: true;
				summonerName: true;
				currentLeague: true;
				currentDivision: true;
				currentLp: true;
				desiredLeague: true;
				desiredDivision: true;
				server: true;
				desiredQueue: true;
				lpGain: true;
				subtotal: true;
				totalAmount: true;
				discountAmount: true;
				extras: { select: { type: true; price: true } };
				client: { select: { username: true } };
				booster: { select: { username: true } };
				createdAt: true;
				adminGovernanceActions: {
					select: { actionType: true; reason: true; createdAt: true };
					orderBy: { createdAt: 'desc' };
					take: 1;
				};
				walletTransactions: {
					where: { type: 'CREDIT'; reason: 'order_completion' };
					select: {
						amount: true;
						availableAt: true;
						releasedAt: true;
						releasedBy: true;
					};
					orderBy: { createdAt: 'desc' };
					take: 1;
				};
			};
		}): Promise<AdminOrderRecord | null>;
	};
	payment: {
		aggregate(args: {
			where: { status: { in: string[] } };
			_sum: { grossAmount: true };
		}): Promise<{ _sum: { grossAmount: number | null } }>;
	};
	ticket: {
		findMany(args: {
			select: {
				id: true;
				userId: true;
				subject: true;
				status: true;
				createdAt: true;
				updatedAt: true;
				messages: {
					select: { createdAt: true };
					orderBy: { createdAt: 'desc' };
					take: 1;
				};
				_count: { select: { messages: true } };
			};
			orderBy: { updatedAt: 'desc' };
			take: number;
		}): Promise<AdminTicketRecord[]>;
	};
};

@Injectable()
export class PrismaAdminDashboardReader {
	constructor(private readonly prisma: PrismaService) {}

	async getMetrics(): Promise<AdminMetricsSnapshot> {
		const [revenue, ordersTotal, activeOrders, activeUsers] = await Promise.all(
			[
				this.getClient().payment.aggregate({
					where: {
						status: { in: [PaymentStatus.HELD, PaymentStatus.RELEASED] },
					},
					_sum: { grossAmount: true },
				}),
				this.getClient().order.count(),
				this.getClient().order.count({
					where: {
						status: {
							in: [
								OrderStatus.AWAITING_PAYMENT,
								OrderStatus.PENDING_BOOSTER,
								OrderStatus.IN_PROGRESS,
							],
						},
					},
				}),
				this.getClient().user.count({
					where: { isActive: true, isBlocked: false },
				}),
			],
		);

		return {
			revenueTotal: revenue._sum.grossAmount ?? 0,
			ordersTotal,
			activeOrders,
			activeUsers,
		};
	}

	async listUsers(input: {
		query?: string;
		limit: number;
	}): Promise<AdminUserSnapshot[]> {
		const query = input.query?.trim();
		const records = await this.getClient().user.findMany({
			where: query
				? {
						OR: [
							{ username: { contains: query, mode: 'insensitive' } },
							{ email: { contains: query, mode: 'insensitive' } },
						],
					}
				: undefined,
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				isActive: true,
				isBlocked: true,
				emailConfirmedAt: true,
				createdAt: true,
			},
			orderBy: { createdAt: 'desc' },
			take: input.limit,
		});

		return records.map((record) => ({
			...record,
			role: ensurePersistedEnum(Role, record.role, 'user role'),
			activationStatus: getActivationStatus(record),
		}));
	}

	async listOrders(input: { limit: number }): Promise<AdminOrderSnapshot[]> {
		const records = await this.getClient().order.findMany({
			select: this.orderSelect(),
			orderBy: { createdAt: 'desc' },
			take: input.limit,
		});

		return records.map((record) => this.mapOrder(record));
	}

	async getOrder(orderId: string): Promise<AdminOrderSnapshot | null> {
		const record = await this.getClient().order.findUnique({
			where: { id: orderId },
			select: this.orderSelect(),
		});
		return record ? this.mapOrder(record) : null;
	}

	private mapOrder(record: AdminOrderRecord): AdminOrderSnapshot {
		return {
			id: record.id,
			clientId: record.clientId,
			boosterId: record.boosterId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			serviceType: record.serviceType,
			summonerName: record.summonerName,
			currentLeague: record.currentLeague,
			currentDivision: record.currentDivision,
			currentLp: record.currentLp,
			desiredLeague: record.desiredLeague,
			desiredDivision: record.desiredDivision,
			server: record.server,
			desiredQueue: record.desiredQueue,
			lpGain: record.lpGain,
			subtotal: record.subtotal,
			totalAmount: record.totalAmount,
			discountAmount: record.discountAmount,
			extras: record.extras,
			client: record.client,
			booster: record.booster,
			createdAt: record.createdAt,
			latestGovernanceAction: record.adminGovernanceActions[0]
				? {
						type: record.adminGovernanceActions[0].actionType,
						reason: record.adminGovernanceActions[0].reason,
						createdAt: record.adminGovernanceActions[0].createdAt,
					}
				: null,
			boosterPayment: record.walletTransactions[0]
				? {
						amount: record.walletTransactions[0].amount,
						availableAt: record.walletTransactions[0].availableAt,
						releasedAt: record.walletTransactions[0].releasedAt,
						releasedBy:
							record.walletTransactions[0].releasedBy === 'ADMIN'
								? 'admin'
								: record.walletTransactions[0].releasedBy === 'SCHEDULE'
									? 'schedule'
									: null,
					}
				: null,
		};
	}

	private orderSelect() {
		return {
			id: true,
			clientId: true,
			boosterId: true,
			status: true,
			serviceType: true,
			summonerName: true,
			currentLeague: true,
			currentDivision: true,
			currentLp: true,
			desiredLeague: true,
			desiredDivision: true,
			server: true,
			desiredQueue: true,
			lpGain: true,
			subtotal: true,
			totalAmount: true,
			discountAmount: true,
			extras: { select: { type: true, price: true } },
			client: { select: { username: true } },
			booster: { select: { username: true } },
			createdAt: true,
			adminGovernanceActions: {
				select: { actionType: true, reason: true, createdAt: true },
				orderBy: { createdAt: 'desc' },
				take: 1,
			},
			walletTransactions: {
				where: { type: 'CREDIT', reason: 'order_completion' },
				select: {
					amount: true,
					availableAt: true,
					releasedAt: true,
					releasedBy: true,
				},
				orderBy: { createdAt: 'desc' },
				take: 1,
			},
		} as const;
	}

	async listSupportTickets(input: {
		limit: number;
	}): Promise<AdminSupportTicketSnapshot[]> {
		const records = await this.getClient().ticket.findMany({
			select: {
				id: true,
				userId: true,
				subject: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				messages: {
					select: { createdAt: true },
					orderBy: { createdAt: 'desc' },
					take: 1,
				},
				_count: { select: { messages: true } },
			},
			orderBy: { updatedAt: 'desc' },
			take: input.limit,
		});

		return records.map((record) => ({
			id: record.id,
			userId: record.userId,
			subject: record.subject,
			status: record.status,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			messageCount: record._count.messages,
			latestMessageAt: record.messages[0]?.createdAt ?? null,
		}));
	}

	private getClient(): AdminDashboardPrismaClient {
		return this.prisma as unknown as AdminDashboardPrismaClient;
	}
}

const getActivationStatus = (record: {
	isActive: boolean;
	emailConfirmedAt: Date | null;
}): AdminUserSnapshot['activationStatus'] => {
	if (record.isActive) return 'ACTIVE';
	if (!record.emailConfirmedAt) return 'PENDING_ACTIVATION';
	return 'INACTIVE';
};
