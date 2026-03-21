import { OrderStatus } from '@modules/orders/domain/order-status';
import {
	PaymentAmountInvalidError,
	PaymentHoldReleaseNotAllowedError,
	PaymentInvalidTransitionError,
} from '@modules/payments/domain/payment.errors';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import type { PaymentMethod } from '@shared/payments/payment-method';

type AllowedTransitionMap = Record<PaymentStatus, readonly PaymentStatus[]>;

const ALLOWED_TRANSITIONS: AllowedTransitionMap = {
	[PaymentStatus.AWAITING_CONFIRMATION]: [
		PaymentStatus.HELD,
		PaymentStatus.FAILED,
	],
	[PaymentStatus.HELD]: [PaymentStatus.RELEASED],
	[PaymentStatus.RELEASED]: [],
	[PaymentStatus.FAILED]: [],
};

export class Payment {
	private constructor(
		public readonly id: string,
		public readonly orderId: string,
		public readonly grossAmount: number,
		public readonly boosterAmount: number,
		public readonly paymentMethod: PaymentMethod,
		public readonly gateway: 'MERCADO_PAGO',
		private attachedGatewayReferenceId: string | null,
		private attachedGatewayId: string | null,
		private attachedGatewayStatus: string | null,
		private attachedGatewayStatusDetail: string | null,
		private currentStatus: PaymentStatus,
	) {}

	static create(input: {
		id: string;
		orderId: string;
		grossAmount: number;
		paymentMethod: PaymentMethod;
	}): Payment {
		if (!Number.isFinite(input.grossAmount) || input.grossAmount <= 0)
			throw new PaymentAmountInvalidError();

		const boosterAmount = Number((input.grossAmount * 0.7).toFixed(2));
		return new Payment(
			input.id,
			input.orderId,
			input.grossAmount,
			boosterAmount,
			input.paymentMethod,
			'MERCADO_PAGO',
			null,
			null,
			null,
			null,
			PaymentStatus.AWAITING_CONFIRMATION,
		);
	}

	static rehydrate(input: {
		id: string;
		orderId: string;
		grossAmount: number;
		boosterAmount: number;
		paymentMethod: PaymentMethod;
		gateway: 'MERCADO_PAGO';
		gatewayReferenceId: string | null;
		gatewayId: string | null;
		gatewayStatus: string | null;
		gatewayStatusDetail: string | null;
		status: PaymentStatus;
	}): Payment {
		return new Payment(
			input.id,
			input.orderId,
			input.grossAmount,
			input.boosterAmount,
			input.paymentMethod,
			input.gateway,
			input.gatewayReferenceId,
			input.gatewayId,
			input.gatewayStatus,
			input.gatewayStatusDetail,
			input.status,
		);
	}

	get status(): PaymentStatus {
		return this.currentStatus;
	}

	get gatewayId(): string | null {
		return this.attachedGatewayId;
	}

	get gatewayReferenceId(): string | null {
		return this.attachedGatewayReferenceId;
	}

	get gatewayStatus(): string | null {
		return this.attachedGatewayStatus;
	}

	get gatewayStatusDetail(): string | null {
		return this.attachedGatewayStatusDetail;
	}

	attachGatewayDetails(input: {
		gatewayReferenceId?: string | null;
		gatewayId: string | null;
		gatewayStatus: string | null;
		gatewayStatusDetail?: string | null;
	}): void {
		if (input.gatewayReferenceId !== undefined)
			this.attachedGatewayReferenceId = input.gatewayReferenceId;

		this.attachedGatewayId = input.gatewayId;
		this.attachedGatewayStatus = input.gatewayStatus;
		if (input.gatewayStatusDetail !== undefined)
			this.attachedGatewayStatusDetail = input.gatewayStatusDetail;
	}

	confirm(): void {
		if (
			this.currentStatus === PaymentStatus.HELD ||
			this.currentStatus === PaymentStatus.RELEASED
		)
			return;

		this.transitionTo(PaymentStatus.HELD);
	}

	fail(): void {
		if (this.currentStatus === PaymentStatus.FAILED) return;

		this.transitionTo(PaymentStatus.FAILED);
	}

	releaseHold(orderStatus: OrderStatus): void {
		if (this.currentStatus === PaymentStatus.RELEASED) return;

		if (orderStatus !== OrderStatus.COMPLETED)
			throw new PaymentHoldReleaseNotAllowedError();

		this.transitionTo(PaymentStatus.RELEASED);
	}

	private transitionTo(nextStatus: PaymentStatus): void {
		const allowed = ALLOWED_TRANSITIONS[this.currentStatus];
		if (!allowed.includes(nextStatus))
			throw new PaymentInvalidTransitionError(this.currentStatus, nextStatus);

		this.currentStatus = nextStatus;
	}
}
