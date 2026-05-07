import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
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
		};
	}): Promise<unknown>;
};

type AdminGovernancePrismaClient = {
	adminGovernanceAction: AdminGovernanceActionDelegate;
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
		await this.getDelegate().create({
			data: {
				adminUserId: action.adminUserId,
				actionType: action.actionType,
				reason: action.reason,
				targetUserId: action.targetUserId ?? null,
				targetOrderId: action.targetOrderId ?? null,
				createdAt: action.createdAt,
			},
		});
	}

	private getDelegate(): AdminGovernanceActionDelegate {
		return (this.prisma as unknown as AdminGovernancePrismaClient)
			.adminGovernanceAction;
	}
}
