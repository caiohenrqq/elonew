import type { Order } from '@modules/orders/domain/order.entity';
import type { User } from '@modules/users/domain/user.entity';

export const ADMIN_GOVERNANCE_REPOSITORY_KEY = Symbol(
	'ADMIN_GOVERNANCE_REPOSITORY_KEY',
);

export type AdminGovernanceActionType =
	| 'USER_BLOCK'
	| 'USER_UNBLOCK'
	| 'ORDER_FORCE_CANCEL';

export type AdminGovernanceActionInput = {
	adminUserId: string;
	actionType: AdminGovernanceActionType;
	reason: string;
	targetUserId?: string | null;
	targetOrderId?: string | null;
	createdAt: Date;
};

export interface AdminGovernanceRepositoryPort {
	findUserById(userId: string): Promise<User | null>;
	saveUser(user: User): Promise<void>;
	findOrderById(orderId: string): Promise<Order | null>;
	saveOrder(order: Order): Promise<void>;
	recordAction(action: AdminGovernanceActionInput): Promise<void>;
}
