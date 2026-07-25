import {
	ADMIN_GOVERNANCE_REPOSITORY_KEY,
	type AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import {
	AdminGovernanceReasonRequiredError,
	AdminOrderBoosterMissingError,
	AdminOrderNotCompletedError,
	AdminOrderNotFoundError,
} from '@modules/admin/domain/admin.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { ForceReleaseOrderCompletionFundsUseCase } from '@modules/wallet/application/use-cases/force-release-order-completion-funds/force-release-order-completion-funds.use-case';
import { Inject, Injectable } from '@nestjs/common';

type ReleaseAdminOrderBoosterPaymentInput = {
	adminUserId: string;
	orderId: string;
	reason: string;
	now: Date;
};

@Injectable()
export class ReleaseAdminOrderBoosterPaymentUseCase {
	constructor(
		@Inject(ADMIN_GOVERNANCE_REPOSITORY_KEY)
		private readonly repository: AdminGovernanceRepositoryPort,
		private readonly forceReleaseOrderCompletionFunds: ForceReleaseOrderCompletionFundsUseCase,
	) {}

	async execute(input: ReleaseAdminOrderBoosterPaymentInput): Promise<void> {
		const reason = input.reason.trim();
		if (!reason) throw new AdminGovernanceReasonRequiredError();

		const order = await this.repository.findOrderById(input.orderId);
		if (!order) throw new AdminOrderNotFoundError();
		if (order.status !== OrderStatus.COMPLETED)
			throw new AdminOrderNotCompletedError();
		if (!order.boosterId) throw new AdminOrderBoosterMissingError();

		await this.forceReleaseOrderCompletionFunds.execute({
			boosterId: order.boosterId,
			orderId: order.id,
			adminUserId: input.adminUserId,
			now: input.now,
		});

		await this.repository.recordAction({
			adminUserId: input.adminUserId,
			actionType: 'ORDER_BOOSTER_PAYMENT_RELEASE',
			reason,
			targetOrderId: order.id,
			targetUserId: order.boosterId,
			changes: { boosterPayment: { from: 'locked', to: 'released' } },
			createdAt: input.now,
		});
	}
}
