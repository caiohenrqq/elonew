import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import { ReleaseAdminOrderBoosterPaymentUseCase } from '@modules/admin/application/use-cases/release-admin-order-booster-payment/release-admin-order-booster-payment.use-case';
import {
	AdminGovernanceReasonRequiredError,
	AdminOrderBoosterMissingError,
	AdminOrderNotCompletedError,
	AdminOrderNotFoundError,
} from '@modules/admin/domain/admin.errors';
import type { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type { User } from '@modules/users/domain/user.entity';
import type { ForceReleaseOrderCompletionFundsUseCase } from '@modules/wallet/application/use-cases/force-release-order-completion-funds/force-release-order-completion-funds.use-case';
import { WalletOrderCompletionAlreadyReleasedError } from '@modules/wallet/domain/wallet.errors';

type OrderStub = Pick<Order, 'id' | 'status' | 'boosterId'>;

class InMemoryAdminGovernanceRepository
	implements AdminGovernanceRepositoryPort
{
	readonly actions: AdminGovernanceActionInput[] = [];

	constructor(private readonly order: OrderStub | null) {}

	async findOrderById(orderId: string): Promise<Order | null> {
		if (!this.order || this.order.id !== orderId) return null;

		return this.order as Order;
	}

	async findUserById(): Promise<User | null> {
		return null;
	}

	async saveUser(): Promise<void> {}

	async saveOrder(): Promise<void> {}

	async recordAction(action: AdminGovernanceActionInput): Promise<void> {
		this.actions.push(action);
	}

	async updateUserAndRecordAction(): Promise<void> {}
}

class ForceReleaseSpy {
	readonly calls: Array<{
		boosterId: string;
		orderId: string;
		adminUserId: string;
		now: Date;
	}> = [];

	constructor(private readonly error?: Error) {}

	async execute(input: {
		boosterId: string;
		orderId: string;
		adminUserId: string;
		now: Date;
	}) {
		if (this.error) throw this.error;
		this.calls.push(input);

		return { releasedAmount: 4000, balanceWithdrawable: 4000 };
	}
}

const now = new Date('2026-07-25T12:00:00.000Z');

const createUseCase = (order: OrderStub | null, releaseError?: Error) => {
	const repository = new InMemoryAdminGovernanceRepository(order);
	const forceRelease = new ForceReleaseSpy(releaseError);
	const useCase = new ReleaseAdminOrderBoosterPaymentUseCase(
		repository,
		forceRelease as unknown as ForceReleaseOrderCompletionFundsUseCase,
	);

	return { useCase, repository, forceRelease };
};

const completedOrder: OrderStub = {
	id: 'order-1',
	status: OrderStatus.COMPLETED,
	boosterId: 'booster-1',
};

describe('ReleaseAdminOrderBoosterPaymentUseCase', () => {
	it('releases the booster payment and records the governance action', async () => {
		const { useCase, repository, forceRelease } = createUseCase(completedOrder);

		await useCase.execute({
			adminUserId: 'admin-1',
			orderId: 'order-1',
			reason: '  cliente confirmou o boost  ',
			now,
		});

		expect(forceRelease.calls).toEqual([
			{
				boosterId: 'booster-1',
				orderId: 'order-1',
				adminUserId: 'admin-1',
				now,
			},
		]);
		expect(repository.actions).toEqual([
			{
				adminUserId: 'admin-1',
				actionType: 'ORDER_BOOSTER_PAYMENT_RELEASE',
				reason: 'cliente confirmou o boost',
				targetOrderId: 'order-1',
				targetUserId: 'booster-1',
				changes: { boosterPayment: { from: 'locked', to: 'released' } },
				createdAt: now,
			},
		]);
	});

	it('requires a reason', async () => {
		const { useCase, forceRelease } = createUseCase(completedOrder);

		await expect(
			useCase.execute({
				adminUserId: 'admin-1',
				orderId: 'order-1',
				reason: '   ',
				now,
			}),
		).rejects.toThrow(AdminGovernanceReasonRequiredError);
		expect(forceRelease.calls).toHaveLength(0);
	});

	it('rejects an unknown order', async () => {
		const { useCase } = createUseCase(null);

		await expect(
			useCase.execute({
				adminUserId: 'admin-1',
				orderId: 'order-1',
				reason: 'motivo',
				now,
			}),
		).rejects.toThrow(AdminOrderNotFoundError);
	});

	it('refuses orders that are not completed', async () => {
		const { useCase, forceRelease } = createUseCase({
			...completedOrder,
			status: OrderStatus.IN_PROGRESS,
		});

		await expect(
			useCase.execute({
				adminUserId: 'admin-1',
				orderId: 'order-1',
				reason: 'motivo',
				now,
			}),
		).rejects.toThrow(AdminOrderNotCompletedError);
		expect(forceRelease.calls).toHaveLength(0);
	});

	it('refuses orders without a booster', async () => {
		const { useCase } = createUseCase({ ...completedOrder, boosterId: null });

		await expect(
			useCase.execute({
				adminUserId: 'admin-1',
				orderId: 'order-1',
				reason: 'motivo',
				now,
			}),
		).rejects.toThrow(AdminOrderBoosterMissingError);
	});

	it('does not record an action when the release fails', async () => {
		const { useCase, repository } = createUseCase(
			completedOrder,
			new WalletOrderCompletionAlreadyReleasedError(),
		);

		await expect(
			useCase.execute({
				adminUserId: 'admin-1',
				orderId: 'order-1',
				reason: 'motivo',
				now,
			}),
		).rejects.toThrow(WalletOrderCompletionAlreadyReleasedError);
		expect(repository.actions).toHaveLength(0);
	});
});
