export const ORDER_COMPLETION_EARNINGS_PORT_KEY = Symbol(
	'ORDER_COMPLETION_EARNINGS_PORT_KEY',
);

export interface OrderCompletionEarningsPort {
	creditCompletedOrderEarnings(input: {
		orderId: string;
		boosterId: string;
		completedAt: Date;
	}): Promise<void>;
}
