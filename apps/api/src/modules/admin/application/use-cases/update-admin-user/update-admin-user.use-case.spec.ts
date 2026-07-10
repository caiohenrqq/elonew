import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import { UpdateAdminUserUseCase } from '@modules/admin/application/use-cases/update-admin-user/update-admin-user.use-case';
import {
	AdminSelfRoleChangeError,
	AdminUsernameAlreadyInUseError,
} from '@modules/admin/domain/admin.errors';
import type { Order } from '@modules/orders/domain/order.entity';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import { Role } from '@packages/auth/roles/role';

const makeUser = (id: string, username: string, role = Role.CLIENT) =>
	User.rehydrate({
		id,
		username,
		email: `${username}@example.com`,
		passwordHash: 'hash',
		role,
		isActive: true,
		isBlocked: false,
		emailConfirmedAt: new Date(),
		emailConfirmationTokenHash: null,
		emailConfirmationTokenExpiresAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

class UsersStub implements UserRepositoryPort {
	constructor(readonly users: User[]) {}
	findById(id: string) {
		return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
	}
	findByUsername(username: string) {
		return Promise.resolve(
			this.users.find((user) => user.username === username) ?? null,
		);
	}
	findByEmail() {
		return Promise.resolve(null);
	}
	findByEmailConfirmationTokenHash() {
		return Promise.resolve(null);
	}
	findByPasswordResetTokenHash() {
		return Promise.resolve(null);
	}
	create(user: User) {
		return Promise.resolve(user);
	}
	save() {
		return Promise.resolve();
	}
}

class GovernanceStub implements AdminGovernanceRepositoryPort {
	actions: AdminGovernanceActionInput[] = [];
	findUserById() {
		return Promise.resolve(null);
	}
	saveUser() {
		return Promise.resolve();
	}
	findOrderById(): Promise<Order | null> {
		return Promise.resolve(null);
	}
	saveOrder() {
		return Promise.resolve();
	}
	recordAction(action: AdminGovernanceActionInput) {
		this.actions.push(action);
		return Promise.resolve();
	}
	updateUserAndRecordAction(_user: User, action: AdminGovernanceActionInput) {
		this.actions.push(action);
		return Promise.resolve();
	}
}

describe('UpdateAdminUserUseCase', () => {
	it('renames a user and records before and after values', async () => {
		const users = new UsersStub([makeUser('target', 'old-name')]);
		const governance = new GovernanceStub();
		await new UpdateAdminUserUseCase(users, governance).execute({
			adminUserId: 'admin',
			targetUserId: 'target',
			username: 'new-name',
			now: new Date(),
		});
		expect(governance.actions[0]).toEqual(
			expect.objectContaining({
				actionType: 'USER_RENAME',
				changes: { username: { from: 'old-name', to: 'new-name' } },
			}),
		);
	});

	it('rejects duplicate usernames', async () => {
		const users = new UsersStub([
			makeUser('target', 'old'),
			makeUser('other', 'taken'),
		]);
		await expect(
			new UpdateAdminUserUseCase(users, new GovernanceStub()).execute({
				adminUserId: 'admin',
				targetUserId: 'target',
				username: 'taken',
				now: new Date(),
			}),
		).rejects.toBeInstanceOf(AdminUsernameAlreadyInUseError);
	});

	it('prevents admins from changing their own role', async () => {
		const users = new UsersStub([makeUser('admin', 'admin', Role.ADMIN)]);
		await expect(
			new UpdateAdminUserUseCase(users, new GovernanceStub()).execute({
				adminUserId: 'admin',
				targetUserId: 'admin',
				role: Role.CLIENT,
				now: new Date(),
			}),
		).rejects.toBeInstanceOf(AdminSelfRoleChangeError);
	});

	it('rejects a self role change even when the role is unchanged', async () => {
		const users = new UsersStub([makeUser('admin', 'admin', Role.ADMIN)]);
		await expect(
			new UpdateAdminUserUseCase(users, new GovernanceStub()).execute({
				adminUserId: 'admin',
				targetUserId: 'admin',
				role: Role.ADMIN,
				now: new Date(),
			}),
		).rejects.toBeInstanceOf(AdminSelfRoleChangeError);
	});
});
