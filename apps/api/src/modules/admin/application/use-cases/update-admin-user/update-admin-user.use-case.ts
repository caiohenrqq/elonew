import {
	ADMIN_GOVERNANCE_REPOSITORY_KEY,
	type AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import {
	AdminSelfRoleChangeError,
	AdminUserNotFoundError,
	AdminUsernameAlreadyInUseError,
} from '@modules/admin/domain/admin.errors';
import {
	USER_REPOSITORY_KEY,
	type UserRepositoryPort,
} from '@modules/users/application/ports/user-repository.port';
import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '@packages/auth/roles/role';

type UpdateAdminUserInput = {
	adminUserId: string;
	targetUserId: string;
	username?: string;
	role?: Role;
	now: Date;
};

@Injectable()
export class UpdateAdminUserUseCase {
	constructor(
		@Inject(USER_REPOSITORY_KEY) private readonly users: UserRepositoryPort,
		@Inject(ADMIN_GOVERNANCE_REPOSITORY_KEY)
		private readonly governance: AdminGovernanceRepositoryPort,
	) {}

	async execute(input: UpdateAdminUserInput): Promise<void> {
		const user = await this.users.findById(input.targetUserId);
		if (!user) throw new AdminUserNotFoundError();

		if (input.username !== undefined) {
			const username = input.username.trim();
			const existing = await this.users.findByUsername(username);
			if (existing && existing.id !== user.id)
				throw new AdminUsernameAlreadyInUseError();
			if (username === user.username) return;
			await this.governance.updateUserAndRecordAction(
				user.rename(username, input.now),
				{
					adminUserId: input.adminUserId,
					actionType: 'USER_RENAME',
					reason: 'admin_user_rename',
					targetUserId: user.id,
					createdAt: input.now,
					changes: { username: { from: user.username, to: username } },
				},
			);
			return;
		}

		if (input.role === undefined) return;
		if (input.adminUserId === input.targetUserId)
			throw new AdminSelfRoleChangeError();
		if (input.role === user.role) return;
		await this.governance.updateUserAndRecordAction(
			user.changeRole(input.role, input.now),
			{
				adminUserId: input.adminUserId,
				actionType: 'USER_ROLE_CHANGE',
				reason: 'admin_user_role_change',
				targetUserId: user.id,
				createdAt: input.now,
				changes: { role: { from: user.role, to: input.role } },
			},
		);
	}
}
