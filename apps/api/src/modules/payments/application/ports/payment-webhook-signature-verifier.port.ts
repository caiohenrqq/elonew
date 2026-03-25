export type VerifyPaymentWebhookSignatureInput = {
	eventId: string;
	topic: string;
	notificationResourceId: string;
	requestId?: string;
	signature?: string;
};

export const PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY = Symbol(
	'PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY',
);

export interface PaymentWebhookSignatureVerifierPort {
	verify(input: VerifyPaymentWebhookSignatureInput): Promise<boolean>;
}
