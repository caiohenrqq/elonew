import type { PaymentMethod } from '@shared/payments/payment-method';

export type InitiatePaymentInput = {
	paymentId: string;
	orderId: string;
	amount: number;
	paymentMethod: PaymentMethod;
};

export type InitiatePaymentOutput = {
	checkoutUrl: string;
	gatewayReferenceId: string;
	gatewayStatus: string | null;
};

export type FetchPaymentNotificationInput = {
	notificationId: string;
};

export type FetchPaymentNotificationOutput = {
	internalPaymentId: string;
	gatewayPaymentId: string;
	gatewayStatus: string;
	gatewayStatusDetail: string | null;
	isApproved: boolean;
};

export const PAYMENT_GATEWAY_PORT_KEY = Symbol('PAYMENT_GATEWAY_PORT_KEY');

export interface PaymentGatewayPort {
	initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput>;
	fetchPaymentNotification(
		input: FetchPaymentNotificationInput,
	): Promise<FetchPaymentNotificationOutput>;
}
