export type MercadoPagoCreatePaymentInput = {
	orderId: string;
	amount: number;
};

export type MercadoPagoCreatePaymentOutput = {
	providerPaymentId: string;
	checkoutUrl: string;
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
	verifyWebhookSignature(input: {
		payload: MercadoPagoWebhookPayload;
		signature?: string;
	}): Promise<boolean>;
}

export const MERCADO_PAGO_SDK_PORT_KEY = Symbol('MERCADO_PAGO_SDK_PORT_KEY');
