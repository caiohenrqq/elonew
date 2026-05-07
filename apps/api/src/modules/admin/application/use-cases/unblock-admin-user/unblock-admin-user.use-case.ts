import {
	ADMIN_GOVERNANCE_REPOSITORY_KEY,
	type AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import {
	AdminGovernanceReasonRequiredError,
	AdminUserNotFoundError,
} from '@modules/admin/domain/admin.errors';
import { Inject, Injectable } from '@nestjs/common';

type UnblockAdminUserInput = {
	adminUserId: string;
	targetUserId: string;
	reason: string;
	now: Date;
};

@Injectable()
export class UnblockAdminUserUseCase {
	constructor(
		@Inject(ADMIN_GOVERNANCE_REPOSITORY_KEY)
		private readonly repository: AdminGovernanceRepositoryPort,
	) {}

	async execute(input: UnblockAdminUserInput): Promise<void> {
		const reason = input.reason.trim();
		if (!reason) throw new AdminGovernanceReasonRequiredError();

		const user = await this.repository.findUserById(input.targetUserId);
		if (!user) throw new AdminUserNotFoundError();

		await this.repository.saveUser(user.unblock());
		await this.repository.recordAction({
			adminUserId: input.adminUserId,
			actionType: 'USER_UNBLOCK',
			reason,
			targetUserId: user.id,
			createdAt: input.now,
		});
	}
}
