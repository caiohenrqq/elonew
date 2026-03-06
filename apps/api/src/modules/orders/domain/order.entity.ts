import {
	OrderCancellationNotAllowedError,
	OrderInvalidTransitionError,
} from '@modules/orders/domain/order.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';

type AllowedTransitionMap = Record<OrderStatus, readonly OrderStatus[]>;

const ALLOWED_TRANSITIONS: AllowedTransitionMap = {
	[OrderStatus.AWAITING_PAYMENT]: [
		OrderStatus.PENDING_BOOSTER,
		OrderStatus.CANCELLED,
	],
	[OrderStatus.PENDING_BOOSTER]: [
		OrderStatus.IN_PROGRESS,
		OrderStatus.CANCELLED,
	],
	[OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED],
	[OrderStatus.COMPLETED]: [],
	[OrderStatus.CANCELLED]: [],
};

export class Order {
	private constructor(
		public readonly id: string,
		private currentStatus: OrderStatus,
	) {}

	static create(id: string): Order {
		return new Order(id, OrderStatus.AWAITING_PAYMENT);
	}

	static rehydrate(input: { id: string; status: OrderStatus }): Order {
		return new Order(input.id, input.status);
	}

	get status(): OrderStatus {
		return this.currentStatus;
	}

	confirmPayment(): void {
		this.transitionTo(OrderStatus.PENDING_BOOSTER);
	}

	acceptByBooster(): void {
		this.transitionTo(OrderStatus.IN_PROGRESS);
	}

	complete(): void {
		this.transitionTo(OrderStatus.COMPLETED);
	}

	cancel(): void {
		if (
			this.currentStatus === OrderStatus.IN_PROGRESS ||
			this.currentStatus === OrderStatus.COMPLETED
		)
			throw new OrderCancellationNotAllowedError();

		this.transitionTo(OrderStatus.CANCELLED);
	}

	private transitionTo(nextStatus: OrderStatus): void {
		const allowed = ALLOWED_TRANSITIONS[this.currentStatus];
		if (!allowed.includes(nextStatus))
			throw new OrderInvalidTransitionError(this.currentStatus, nextStatus);

		this.currentStatus = nextStatus;
	}
}
