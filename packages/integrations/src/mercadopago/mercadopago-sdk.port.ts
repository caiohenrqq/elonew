type MercadoPagoSelectedPaymentMethod = 'credit_card' | 'pix' | 'boleto';

export type MercadoPagoCreatePaymentInput = {
	paymentId: string;
	orderId: string;
	amount: number;
	paymentMethod: MercadoPagoSelectedPaymentMethod;
};

export type MercadoPagoCreatePaymentOutput = {
	checkoutUrl: string;
	gatewayReferenceId: string;
	gatewayStatus: string | null;
};

export type MercadoPagoFetchPaymentNotificationInput = {
	notificationId: string;
};

export type MercadoPagoFetchPaymentNotificationOutput = {
	internalPaymentId: string;
	gatewayPaymentId: string;
	gatewayStatus: string;
	gatewayStatusDetail: string | null;
};

export type MercadoPagoWebhookPayload = {
	eventId: string;
	topic: string;
	resourceId: string;
};

export interface MercadoPagoSdkPort {
	createPayment(
		input: MercadoPagoCreatePaymentInput,
	): Promise<MercadoPagoCreatePaymentOutput>;
	fetchPaymentNotification(
		input: MercadoPagoFetchPaymentNotificationInput,
	): Promise<MercadoPagoFetchPaymentNotificationOutput>;
	verifyWebhookSignature(input: {
		payload: MercadoPagoWebhookPayload;
		signature?: string;
		requestId?: string;
	}): Promise<boolean>;
}

export const MERCADO_PAGO_SDK_PORT_KEY = Symbol('MERCADO_PAGO_SDK_PORT_KEY');
