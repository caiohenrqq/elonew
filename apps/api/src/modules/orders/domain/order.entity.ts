import {
	OrderCancellationNotAllowedError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
} from '@modules/orders/domain/order.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderPricedExtra } from '@shared/orders/order-extra';
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
		private readonly currentCouponId: string | null,
		private readonly currentPricingVersionId: string | null,
		private currentStatus: OrderStatus,
		private currentCredentials: OrderCredentials | null,
		private readonly currentRequestDetails: OrderRequestDetails | null,
		private readonly currentSubtotal: number | null,
		private readonly currentTotalAmount: number | null,
		private readonly currentDiscountAmount: number,
		private readonly currentExtras: OrderPricedExtra[],
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
			null,
			null,
			OrderStatus.AWAITING_PAYMENT,
			null,
			input?.requestDetails ?? null,
			null,
			null,
			0,
			[],
		);
	}

	static createDraft(input: {
		id?: string;
		clientId: string;
		boosterId?: string | null;
		couponId?: string | null;
		pricingVersionId: string;
		requestDetails: OrderRequestDetails;
		pricing: {
			subtotal: number;
			totalAmount: number;
			discountAmount: number;
			extras?: OrderPricedExtra[];
		};
	}): Order {
		return new Order(
			input.id ?? '',
			input.clientId,
			input.boosterId ?? null,
			input.couponId ?? null,
			input.pricingVersionId,
			OrderStatus.AWAITING_PAYMENT,
			null,
			input.requestDetails,
			input.pricing.subtotal,
			input.pricing.totalAmount,
			input.pricing.discountAmount,
			(input.pricing.extras ?? []).map((extra) => ({ ...extra })),
		);
	}

	static rehydrate(input: {
		id: string;
		clientId?: string | null;
		boosterId?: string | null;
		couponId?: string | null;
		pricingVersionId?: string | null;
		status: OrderStatus;
		credentials?: OrderCredentials | null;
		requestDetails?: OrderRequestDetails | null;
		subtotal?: number | null;
		totalAmount?: number | null;
		discountAmount?: number;
		extras?: OrderPricedExtra[];
	}): Order {
		return new Order(
			input.id,
			input.clientId ?? null,
			input.boosterId ?? null,
			input.couponId ?? null,
			input.pricingVersionId ?? null,
			input.status,
			input.credentials ?? null,
			input.requestDetails ?? null,
			input.subtotal ?? null,
			input.totalAmount ?? null,
			input.discountAmount ?? 0,
			(input.extras ?? []).map((extra) => ({ ...extra })),
		);
	}

	get clientId(): string | null {
		return this.currentClientId;
	}

	get boosterId(): string | null {
		return this.currentBoosterId;
	}

	get couponId(): string | null {
		return this.currentCouponId;
	}

	get pricingVersionId(): string | null {
		return this.currentPricingVersionId;
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

	get subtotal(): number | null {
		return this.currentSubtotal;
	}

	get totalAmount(): number | null {
		return this.currentTotalAmount;
	}

	get discountAmount(): number {
		return this.currentDiscountAmount;
	}

	get extras(): OrderPricedExtra[] {
		return this.currentExtras.map((extra) => ({ ...extra }));
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

	clearCredentials(): void {
		this.currentCredentials = null;
	}

	private transitionTo(nextStatus: OrderStatus): void {
		const allowed = ALLOWED_TRANSITIONS[this.currentStatus];
		if (!allowed.includes(nextStatus))
			throw new OrderInvalidTransitionError(this.currentStatus, nextStatus);

		this.currentStatus = nextStatus;
	}
}
