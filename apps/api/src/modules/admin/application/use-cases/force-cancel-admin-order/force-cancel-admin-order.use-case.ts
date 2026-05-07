import {
	ADMIN_GOVERNANCE_REPOSITORY_KEY,
	type AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import {
	AdminGovernanceReasonRequiredError,
	AdminOrderNotFoundError,
} from '@modules/admin/domain/admin.errors';
import { Inject, Injectable } from '@nestjs/common';

type ForceCancelAdminOrderInput = {
	adminUserId: string;
	orderId: string;
	reason: string;
	now: Date;
};

@Injectable()
export class ForceCancelAdminOrderUseCase {
	constructor(
		@Inject(ADMIN_GOVERNANCE_REPOSITORY_KEY)
		private readonly repository: AdminGovernanceRepositoryPort,
	) {}

	async execute(input: ForceCancelAdminOrderInput): Promise<void> {
		const reason = input.reason.trim();
		if (!reason) throw new AdminGovernanceReasonRequiredError();

		const order = await this.repository.findOrderById(input.orderId);
		if (!order) throw new AdminOrderNotFoundError();

		order.cancel();
		await this.repository.saveOrder(order);
		await this.repository.recordAction({
			adminUserId: input.adminUserId,
			actionType: 'ORDER_FORCE_CANCEL',
			reason,
			targetOrderId: order.id,
			createdAt: input.now,
		});
	}
}
