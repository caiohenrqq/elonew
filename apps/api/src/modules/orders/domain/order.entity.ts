import {
	OrderCancellationNotAllowedError,
	OrderCredentialsStorageNotAllowedError,
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

const CREDENTIALS_ALLOWED_STATUSES = new Set<OrderStatus>([
	OrderStatus.PENDING_BOOSTER,
	OrderStatus.IN_PROGRESS,
]);

export type OrderCredentials = {
	login: string;
	summonerName: string;
	password: string;
};

export class Order {
	private constructor(
		public readonly id: string,
		private currentStatus: OrderStatus,
		private currentCredentials: OrderCredentials | null,
	) {}

	static create(id: string): Order {
		return new Order(id, OrderStatus.AWAITING_PAYMENT, null);
	}

	static rehydrate(input: {
		id: string;
		status: OrderStatus;
		credentials?: OrderCredentials | null;
	}): Order {
		return new Order(input.id, input.status, input.credentials ?? null);
	}

	get status(): OrderStatus {
		return this.currentStatus;
	}

	get credentials(): OrderCredentials | null {
		return this.currentCredentials;
	}

	confirmPayment(): void {
		this.transitionTo(OrderStatus.PENDING_BOOSTER);
	}

	rejectByBooster(): void {
		if (this.currentStatus !== OrderStatus.PENDING_BOOSTER)
			throw new OrderInvalidTransitionError(
				this.currentStatus,
				OrderStatus.PENDING_BOOSTER,
			);
	}

	acceptByBooster(): void {
		this.transitionTo(OrderStatus.IN_PROGRESS);
	}

	complete(): void {
		this.transitionTo(OrderStatus.COMPLETED);
		this.currentCredentials = null;
	}

	cancel(): void {
		if (
			this.currentStatus === OrderStatus.IN_PROGRESS ||
			this.currentStatus === OrderStatus.COMPLETED
		)
			throw new OrderCancellationNotAllowedError();

		this.transitionTo(OrderStatus.CANCELLED);
	}

	setCredentials(credentials: OrderCredentials): void {
		if (!CREDENTIALS_ALLOWED_STATUSES.has(this.currentStatus))
			throw new OrderCredentialsStorageNotAllowedError();

		this.currentCredentials = credentials;
	}

	private transitionTo(nextStatus: OrderStatus): void {
		const allowed = ALLOWED_TRANSITIONS[this.currentStatus];
		if (!allowed.includes(nextStatus))
			throw new OrderInvalidTransitionError(this.currentStatus, nextStatus);

		this.currentStatus = nextStatus;
	}
}
