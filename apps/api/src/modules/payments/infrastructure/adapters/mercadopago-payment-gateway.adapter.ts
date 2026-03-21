import type {
	FetchPaymentNotificationInput,
	FetchPaymentNotificationOutput,
	InitiatePaymentInput,
	InitiatePaymentOutput,
	PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import { Inject, Injectable } from '@nestjs/common';
import {
	MERCADO_PAGO_SDK_PORT_KEY,
	type MercadoPagoSdkPort,
} from '@packages/integrations/mercadopago/mercadopago-sdk.port';

@Injectable()
export class MercadoPagoPaymentGatewayAdapter implements PaymentGatewayPort {
	constructor(
		@Inject(MERCADO_PAGO_SDK_PORT_KEY)
		private readonly mercadoPagoSdk: MercadoPagoSdkPort,
	) {}

	async initiatePayment(
		input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		return await this.mercadoPagoSdk.createPayment(input);
	}

	async fetchPaymentNotification(
		input: FetchPaymentNotificationInput,
	): Promise<FetchPaymentNotificationOutput> {
		return await this.mercadoPagoSdk.fetchPaymentNotification({
			notificationId: input.notificationId,
		});
	}
}
