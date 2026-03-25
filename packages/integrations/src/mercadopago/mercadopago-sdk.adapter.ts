import { createHmac, timingSafeEqual } from 'node:crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import type { PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes';
import type {
	MercadoPagoCreatePaymentInput,
	MercadoPagoCreatePaymentOutput,
	MercadoPagoFetchPaymentNotificationInput,
	MercadoPagoFetchPaymentNotificationOutput,
	MercadoPagoSdkPort,
	MercadoPagoWebhookPayload,
} from './mercadopago-sdk.port';

type MercadoPagoPreferenceClient = {
	create(input: {
		body: {
			external_reference: string;
			items: Array<{
				id: string;
				title: string;
				quantity: number;
				unit_price: number;
			}>;
			notification_url: string;
			payment_methods?: {
				excluded_payment_types?: Array<{ id: string }>;
			};
		};
	}): Promise<PreferenceResponse>;
};

type MercadoPagoPaymentClient = {
	get(input: { id: string }): Promise<PaymentResponse>;
};

function buildExcludedPaymentTypes(
	input: MercadoPagoCreatePaymentInput,
): Array<{
	id: string;
}> {
	switch (input.paymentMethod) {
		case 'credit_card':
			return [{ id: 'ticket' }, { id: 'bank_transfer' }, { id: 'atm' }];
		case 'pix':
			return [
				{ id: 'credit_card' },
				{ id: 'debit_card' },
				{ id: 'ticket' },
				{ id: 'atm' },
			];
		case 'boleto':
			return [
				{ id: 'credit_card' },
				{ id: 'debit_card' },
				{ id: 'bank_transfer' },
				{ id: 'atm' },
			];
		default:
			throw new Error(
				`Unsupported Mercado Pago payment method: ${input.paymentMethod}`,
			);
	}
}

export class MercadoPagoSdkAdapter implements MercadoPagoSdkPort {
	private readonly preferenceClient: MercadoPagoPreferenceClient;
	private readonly paymentClient: MercadoPagoPaymentClient;

	constructor(input: {
		accessToken: string;
		webhookSecret: string;
		webhookUrl: string;
		preferenceClient?: MercadoPagoPreferenceClient;
		paymentClient?: MercadoPagoPaymentClient;
	}) {
		this.webhookSecret = input.webhookSecret;
		this.webhookUrl = input.webhookUrl;

		if (input.preferenceClient && input.paymentClient) {
			this.preferenceClient = input.preferenceClient;
			this.paymentClient = input.paymentClient;
			return;
		}

		const config = new MercadoPagoConfig({
			accessToken: input.accessToken,
		});

		this.preferenceClient = input.preferenceClient ?? new Preference(config);
		this.paymentClient = input.paymentClient ?? new Payment(config);
	}

	private readonly webhookSecret: string;
	private readonly webhookUrl: string;

	async createPayment(
		input: MercadoPagoCreatePaymentInput,
	): Promise<MercadoPagoCreatePaymentOutput> {
		const response = await this.preferenceClient.create({
			body: {
				external_reference: input.paymentId,
				items: [
					{
						id: input.orderId,
						title: `Boosting order ${input.orderId}`,
						quantity: 1,
						unit_price: input.amount,
					},
				],
				notification_url: this.webhookUrl,
				payment_methods: {
					excluded_payment_types: buildExcludedPaymentTypes(input),
				},
			},
		});
		if (!response.id || !response.init_point)
			throw new Error('Mercado Pago preference response is invalid.');

		return {
			checkoutUrl: response.init_point,
			gatewayReferenceId: response.id,
			gatewayStatus: null,
		};
	}

	async fetchPaymentNotification(
		input: MercadoPagoFetchPaymentNotificationInput,
	): Promise<MercadoPagoFetchPaymentNotificationOutput> {
		const response = await this.paymentClient.get({
			id: input.notificationId,
		});
		if (!response.id || !response.status)
			throw new Error('Mercado Pago payment response is invalid.');

		return {
			internalPaymentId: response.external_reference?.trim() ?? '',
			gatewayPaymentId: String(response.id),
			gatewayStatus: response.status,
			gatewayStatusDetail: response.status_detail ?? null,
			isApproved: response.status === 'approved',
		};
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
