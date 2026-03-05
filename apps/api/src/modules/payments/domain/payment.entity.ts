import { OrderStatus } from '@modules/orders/domain/order-status';
import { PaymentStatus } from '@modules/payments/domain/payment-status';

type AllowedTransitionMap = Record<PaymentStatus, readonly PaymentStatus[]>;

const ALLOWED_TRANSITIONS: AllowedTransitionMap = {
	[PaymentStatus.AWAITING_CONFIRMATION]: [PaymentStatus.HELD],
	[PaymentStatus.HELD]: [PaymentStatus.RELEASED],
	[PaymentStatus.RELEASED]: [],
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
		if (input.grossAmount <= 0)
			throw new Error('Payment amount must be greater than zero.');

		const boosterAmount = Number((input.grossAmount * 0.7).toFixed(2));
		return new Payment(
			input.id,
			input.orderId,
			input.grossAmount,
			boosterAmount,
			PaymentStatus.AWAITING_CONFIRMATION,
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

	releaseHold(orderStatus: OrderStatus): void {
		if (this.currentStatus === PaymentStatus.RELEASED) return;

		if (orderStatus !== OrderStatus.COMPLETED)
			throw new Error(
				'Payment hold can only be released after order completion.',
			);

		this.transitionTo(PaymentStatus.RELEASED);
	}

	private transitionTo(nextStatus: PaymentStatus): void {
		const allowed = ALLOWED_TRANSITIONS[this.currentStatus];
		if (!allowed.includes(nextStatus))
			throw new Error(
				`Invalid payment transition: ${this.currentStatus} -> ${nextStatus}.`,
			);

		this.currentStatus = nextStatus;
	}
}
