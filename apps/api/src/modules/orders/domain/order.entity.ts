import {
	OrderCancellationNotAllowedError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
} from '@modules/orders/domain/order.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderServiceType } from '@shared/orders/service-type';

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

export type OrderRequestDetails = {
	serviceType: OrderServiceType;
	currentLeague: string;
	currentDivision: string;
	currentLp: number;
	desiredLeague: string;
	desiredDivision: string;
	server: string;
	desiredQueue: string;
	lpGain: number;
	deadline: Date;
};

export class Order {
	private constructor(
		public readonly id: string,
		private readonly currentClientId: string | null,
		private currentBoosterId: string | null,
		private currentStatus: OrderStatus,
		private currentCredentials: OrderCredentials | null,
		private readonly currentRequestDetails: OrderRequestDetails | null,
	) {}

	static create(
		id: string,
		input?: {
			clientId?: string | null;
			boosterId?: string | null;
			requestDetails?: OrderRequestDetails | null;
		},
	): Order {
		return new Order(
			id,
			input?.clientId ?? null,
			input?.boosterId ?? null,
			OrderStatus.AWAITING_PAYMENT,
			null,
			input?.requestDetails ?? null,
		);
	}

	static createDraft(input: {
		clientId: string;
		requestDetails: OrderRequestDetails;
	}): Order {
		return new Order(
			'',
			input.clientId,
			null,
			OrderStatus.AWAITING_PAYMENT,
			null,
			input.requestDetails,
		);
	}

	static rehydrate(input: {
		id: string;
		clientId?: string | null;
		boosterId?: string | null;
		status: OrderStatus;
		credentials?: OrderCredentials | null;
		requestDetails?: OrderRequestDetails | null;
	}): Order {
		return new Order(
			input.id,
			input.clientId ?? null,
			input.boosterId ?? null,
			input.status,
			input.credentials ?? null,
			input.requestDetails ?? null,
		);
	}

	get clientId(): string | null {
		return this.currentClientId;
	}

	get boosterId(): string | null {
		return this.currentBoosterId;
	}

	get status(): OrderStatus {
		return this.currentStatus;
	}

	get credentials(): OrderCredentials | null {
		return this.currentCredentials;
	}

	get requestDetails(): OrderRequestDetails | null {
		return this.currentRequestDetails;
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

	assignBooster(boosterId: string): void {
		this.currentBoosterId = boosterId;
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
