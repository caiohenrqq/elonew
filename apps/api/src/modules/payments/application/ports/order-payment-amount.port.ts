export const ORDER_PAYMENT_AMOUNT_PORT_KEY = Symbol(
	'ORDER_PAYMENT_AMOUNT_PORT_KEY',
);

export interface OrderPaymentAmountPort {
	findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<number | null>;
}
