import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import { AdminUsernameAlreadyInUseError } from '@modules/admin/domain/admin.errors';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import type { Order } from '@modules/orders/domain/order.entity';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import type { User } from '@modules/users/domain/user.entity';
import { Inject, Injectable } from '@nestjs/common';

type AdminGovernanceActionDelegate = {
	create(args: {
		data: {
			adminUserId: string;
			actionType: string;
			reason: string;
			targetUserId?: string | null;
			targetOrderId?: string | null;
			createdAt: Date;
			changes?: Record<string, { from: string; to: string }>;
		};
	}): Promise<unknown>;
};

type AdminGovernancePrismaClient = {
	adminGovernanceAction: AdminGovernanceActionDelegate;
	$transaction(operations: Promise<unknown>[]): Promise<unknown[]>;
	user: {
		update(args: {
			where: { id: string };
			data: Record<string, unknown>;
		}): Promise<unknown>;
	};
	authSession: {
		updateMany(args: {
			where: { userId: string; revokedAt: null };
			data: { revokedAt: Date };
		}): Promise<unknown>;
	};
};

@Injectable()
export class PrismaAdminGovernanceRepository
	implements AdminGovernanceRepositoryPort
{
	constructor(
		private readonly prisma: PrismaService,
		@Inject(USER_REPOSITORY_KEY)
		private readonly users: UserRepositoryPort,
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orders: OrderRepositoryPort,
	) {}

	async findUserById(userId: string): Promise<User | null> {
		return await this.users.findById(userId);
	}

	async saveUser(user: User): Promise<void> {
		await this.users.save(user);
	}

	async findOrderById(orderId: string): Promise<Order | null> {
		return await this.orders.findById(orderId);
	}

	async saveOrder(order: Order): Promise<void> {
		await this.orders.save(order);
	}

	async recordAction(action: AdminGovernanceActionInput): Promise<void> {
		await this.getDelegate().create({ data: this.buildActionData(action) });
	}

	async updateUserAndRecordAction(
		user: User,
		action: AdminGovernanceActionInput,
	): Promise<void> {
		const client = this.prisma as unknown as AdminGovernancePrismaClient;
		try {
			await client.$transaction([
				client.user.update({
					where: { id: user.id },
					data: {
						username: user.username,
						role: user.role,
						updatedAt: user.updatedAt,
					},
				}),
				client.adminGovernanceAction.create({
					data: this.buildActionData(action),
				}),
				client.authSession.updateMany({
					where: { userId: user.id, revokedAt: null },
					data: { revokedAt: action.createdAt },
				}),
			]);
		} catch (error) {
			// username is the only unique column this transaction writes
			if (this.isUniqueConstraintError(error))
				throw new AdminUsernameAlreadyInUseError();
			throw error;
		}
	}

	private buildActionData(action: AdminGovernanceActionInput) {
		return {
			adminUserId: action.adminUserId,
			actionType: action.actionType,
			reason: action.reason,
			targetUserId: action.targetUserId ?? null,
			targetOrderId: action.targetOrderId ?? null,
			createdAt: action.createdAt,
			changes: action.changes,
		};
	}

	private isUniqueConstraintError(error: unknown): boolean {
		return (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			(error as { code: unknown }).code === 'P2002'
		);
	}

	private getDelegate(): AdminGovernanceActionDelegate {
		return (this.prisma as unknown as AdminGovernancePrismaClient)
			.adminGovernanceAction;
	}
}
