import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import { UnblockAdminUserUseCase } from '@modules/admin/application/use-cases/unblock-admin-user/unblock-admin-user.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { User } from '@modules/users/domain/user.entity';
import { Role } from '@packages/auth/roles/role';

class AdminGovernanceRepositoryStub implements AdminGovernanceRepositoryPort {
	user: User | null = User.rehydrate({
		id: 'client-1',
		username: 'Client',
		email: 'client@example.com',
		passwordHash: 'hash',
		role: Role.CLIENT,
		isActive: true,
		isBlocked: true,
		emailConfirmedAt: new Date('2026-01-01T00:00:00.000Z'),
		emailConfirmationTokenHash: null,
		emailConfirmationTokenExpiresAt: null,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	});
	actions: AdminGovernanceActionInput[] = [];

	findUserById(): Promise<User | null> {
		return Promise.resolve(this.user);
	}

	saveUser(user: User): Promise<void> {
		this.user = user;
		return Promise.resolve();
	}

	findOrderById(): Promise<Order | null> {
		return Promise.resolve(null);
	}

	saveOrder(): Promise<void> {
		return Promise.resolve();
	}

	recordAction(action: AdminGovernanceActionInput): Promise<void> {
		this.actions.push(action);
		return Promise.resolve();
	}
}

describe('UnblockAdminUserUseCase', () => {
	it('unblocks a user and records the admin reason', async () => {
		const repository = new AdminGovernanceRepositoryStub();
		const useCase = new UnblockAdminUserUseCase(repository);
		const now = new Date('2026-05-05T12:00:00.000Z');

		await useCase.execute({
			adminUserId: 'admin-1',
			targetUserId: 'client-1',
			reason: 'chargeback settled',
			now,
		});

		expect(repository.user?.isBlocked).toBe(false);
		expect(repository.actions).toEqual([
			{
				adminUserId: 'admin-1',
				actionType: 'USER_UNBLOCK',
				reason: 'chargeback settled',
				targetUserId: 'client-1',
				createdAt: now,
			},
		]);
	});
});
