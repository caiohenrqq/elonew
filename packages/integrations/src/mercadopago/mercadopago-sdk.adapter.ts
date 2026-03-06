import type {
	MercadoPagoCreatePaymentInput,
	MercadoPagoCreatePaymentOutput,
	MercadoPagoSdkPort,
	MercadoPagoWebhookPayload,
} from './mercadopago-sdk.port';

export class MercadoPagoSdkAdapter implements MercadoPagoSdkPort {
	async createPayment(
		_input: MercadoPagoCreatePaymentInput,
	): Promise<MercadoPagoCreatePaymentOutput> {
		throw new Error('Not implemented yet.');
	}

	async verifyWebhookSignature(input: {
		payload: MercadoPagoWebhookPayload;
		signature?: string;
	}): Promise<boolean> {
		void input;
		throw new Error('Not implemented yet.');
	}
}
