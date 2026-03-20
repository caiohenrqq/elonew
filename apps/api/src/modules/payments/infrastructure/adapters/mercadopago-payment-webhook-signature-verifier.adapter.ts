import {
	MERCADO_PAGO_SDK_PORT_KEY,
	type MercadoPagoSdkPort,
} from '@integrations/mercadopago/mercadopago-sdk.port';
import type {
	PaymentWebhookSignatureVerifierPort,
	VerifyPaymentWebhookSignatureInput,
} from '@modules/payments/application/ports/payment-webhook-signature-verifier.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MercadoPagoPaymentWebhookSignatureVerifierAdapter
	implements PaymentWebhookSignatureVerifierPort
{
	constructor(
		@Inject(MERCADO_PAGO_SDK_PORT_KEY)
		private readonly mercadoPagoSdk: MercadoPagoSdkPort,
	) {}

	async verify(input: VerifyPaymentWebhookSignatureInput): Promise<boolean> {
		return await this.mercadoPagoSdk.verifyWebhookSignature({
			payload: {
				eventId: input.eventId,
				topic: 'payment',
				resourceId: input.notificationResourceId,
			},
			signature: input.signature,
			requestId: input.requestId,
		});
	}
}
