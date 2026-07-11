import type { Order } from '@modules/orders/domain/order.entity';
import type { User } from '@modules/users/domain/user.entity';

export const ADMIN_GOVERNANCE_REPOSITORY_KEY = Symbol(
	'ADMIN_GOVERNANCE_REPOSITORY_KEY',
);

export type AdminGovernanceActionType =
	| 'USER_CREATE'
	| 'USER_BLOCK'
	| 'USER_UNBLOCK'
	| 'USER_RENAME'
	| 'USER_ROLE_CHANGE'
	| 'ORDER_FORCE_CANCEL'
	| 'PAYMENT_LATE_APPROVAL';

export type AdminGovernanceActionInput = {
	adminUserId: string;
	actionType: AdminGovernanceActionType;
	reason: string;
	changes?: Record<string, { from: string; to: string }>;
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
	updateUserAndRecordAction(
		user: User,
		action: AdminGovernanceActionInput,
	): Promise<void>;
}
