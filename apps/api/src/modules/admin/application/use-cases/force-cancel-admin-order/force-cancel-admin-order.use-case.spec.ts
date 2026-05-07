import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import { ForceCancelAdminOrderUseCase } from '@modules/admin/application/use-cases/force-cancel-admin-order/force-cancel-admin-order.use-case';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderCancellationNotAllowedError } from '@modules/orders/domain/order.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { User } from '@modules/users/domain/user.entity';

class AdminGovernanceRepositoryStub implements AdminGovernanceRepositoryPort {
	order: Order | null = Order.rehydrate({
		id: 'order-1',
		clientId: 'client-1',
		status: OrderStatus.PENDING_BOOSTER,
	});
	actions: AdminGovernanceActionInput[] = [];

	findUserById(): Promise<User | null> {
		return Promise.resolve(null);
	}

	saveUser(): Promise<void> {
		return Promise.resolve();
	}

	findOrderById(): Promise<Order | null> {
		return Promise.resolve(this.order);
	}

	saveOrder(order: Order): Promise<void> {
		this.order = order;
		return Promise.resolve();
	}

	recordAction(action: AdminGovernanceActionInput): Promise<void> {
		this.actions.push(action);
		return Promise.resolve();
	}
}

describe('ForceCancelAdminOrderUseCase', () => {
	it('cancels a safe order state and records the admin reason', async () => {
		const repository = new AdminGovernanceRepositoryStub();
		const useCase = new ForceCancelAdminOrderUseCase(repository);
		const now = new Date('2026-05-05T12:00:00.000Z');

		await useCase.execute({
			adminUserId: 'admin-1',
			orderId: 'order-1',
			reason: 'client requested manual intervention',
			now,
		});

		expect(repository.order?.status).toBe(OrderStatus.CANCELLED);
		expect(repository.actions).toEqual([
			{
				adminUserId: 'admin-1',
				actionType: 'ORDER_FORCE_CANCEL',
				reason: 'client requested manual intervention',
				targetOrderId: 'order-1',
				createdAt: now,
			},
		]);
	});

	it('rejects cancelling an unsafe order state', async () => {
		const repository = new AdminGovernanceRepositoryStub();
		repository.order = Order.rehydrate({
			id: 'order-1',
			clientId: 'client-1',
			boosterId: 'booster-1',
			status: OrderStatus.IN_PROGRESS,
		});
		const useCase = new ForceCancelAdminOrderUseCase(repository);

		await expect(
			useCase.execute({
				adminUserId: 'admin-1',
				orderId: 'order-1',
				reason: 'manual review',
				now: new Date('2026-05-05T12:00:00.000Z'),
			}),
		).rejects.toThrow(OrderCancellationNotAllowedError);
		expect(repository.order.status).toBe(OrderStatus.IN_PROGRESS);
		expect(repository.actions).toEqual([]);
	});
});
