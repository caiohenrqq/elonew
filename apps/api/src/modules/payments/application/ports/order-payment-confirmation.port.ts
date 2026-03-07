export const ORDER_PAYMENT_CONFIRMATION_PORT_KEY = Symbol(
	'ORDER_PAYMENT_CONFIRMATION_PORT_KEY',
);

export interface OrderPaymentConfirmationPort {
	markAsPaid(orderId: string): Promise<void>;
}
