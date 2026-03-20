import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
	MercadoPagoCreatePaymentInput,
	MercadoPagoCreatePaymentOutput,
	MercadoPagoSdkPort,
	MercadoPagoWebhookPayload,
} from './mercadopago-sdk.port';

export class MercadoPagoSdkAdapter implements MercadoPagoSdkPort {
	constructor(private readonly webhookSecret: string) {}

	async createPayment(
		_input: MercadoPagoCreatePaymentInput,
	): Promise<MercadoPagoCreatePaymentOutput> {
		throw new Error('Not implemented yet.');
	}

	async verifyWebhookSignature(input: {
		payload: MercadoPagoWebhookPayload;
		signature?: string;
		requestId?: string;
	}): Promise<boolean> {
		const ts = this.extractSignaturePart(input.signature, 'ts');
		const v1 = this.extractSignaturePart(input.signature, 'v1');
		if (!ts || !v1 || !input.requestId || !input.payload.resourceId)
			return false;

		const manifest = `id:${input.payload.resourceId.toLowerCase()};request-id:${input.requestId};ts:${ts};`;
		const expectedSignature = createHmac('sha256', this.webhookSecret)
			.update(manifest)
			.digest();
		const receivedSignature = Buffer.from(v1, 'hex');

		if (
			expectedSignature.length !== receivedSignature.length ||
			!timingSafeEqual(expectedSignature, receivedSignature)
		)
			return false;

		return true;
	}

	private extractSignaturePart(
		signature: string | undefined,
		key: 'ts' | 'v1',
	): string | null {
		if (!signature) return null;

		for (const part of signature.split(',')) {
			const [partKey, partValue] = part.trim().split('=');
			if (partKey === key && partValue) return partValue;
		}

		return null;
	}
}
