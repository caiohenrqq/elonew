import { OrderStatus } from '@modules/orders/domain/order-status';
import {
	PaymentAmountInvalidError,
	PaymentHoldReleaseNotAllowedError,
	PaymentInvalidTransitionError,
} from '@modules/payments/domain/payment.errors';
import { PaymentStatus } from '@modules/payments/domain/payment-status';

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
		private currentStatus: PaymentStatus,
	) {}

	static create(input: {
		id: string;
		orderId: string;
		grossAmount: number;
	}): Payment {
		if (!Number.isFinite(input.grossAmount) || input.grossAmount <= 0)
			throw new PaymentAmountInvalidError();

		const boosterAmount = Number((input.grossAmount * 0.7).toFixed(2));
		return new Payment(
			input.id,
			input.orderId,
			input.grossAmount,
			boosterAmount,
			PaymentStatus.AWAITING_CONFIRMATION,
		);
	}

	static rehydrate(input: {
		id: string;
		orderId: string;
		grossAmount: number;
		boosterAmount: number;
		status: PaymentStatus;
	}): Payment {
		return new Payment(
			input.id,
			input.orderId,
			input.grossAmount,
			input.boosterAmount,
			input.status,
		);
	}

	get status(): PaymentStatus {
		return this.currentStatus;
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
