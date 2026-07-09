import { createHmac, timingSafeEqual } from 'node:crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import type { PaymentSearchResult } from 'mercadopago/dist/clients/payment/search/types';
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
			back_urls: {
				success: string;
				pending: string;
				failure: string;
			};
			auto_return: 'approved';
		};
	}): Promise<PreferenceResponse>;
};

type MercadoPagoPaymentClient = {
	get(input: { id: string }): Promise<PaymentResponse>;
	search?(input: {
		options: {
			external_reference: string;
			limit: number;
		};
	}): Promise<{ results?: PaymentSearchResult[] }>;
};

export class MercadoPagoSdkAdapter implements MercadoPagoSdkPort {
	private readonly preferenceClient: MercadoPagoPreferenceClient;
	private readonly paymentClient: MercadoPagoPaymentClient;

	constructor(input: {
		accessToken: string;
		webhookSecret: string;
		webhookUrl: string;
		webAppUrl: string;
		preferenceClient?: MercadoPagoPreferenceClient;
		paymentClient?: MercadoPagoPaymentClient;
	}) {
		this.webhookSecret = input.webhookSecret;
		this.webhookUrl = input.webhookUrl;
		this.webAppUrl = input.webAppUrl;

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
	private readonly webAppUrl: string;

	async createPayment(
		input: MercadoPagoCreatePaymentInput,
	): Promise<MercadoPagoCreatePaymentOutput> {
		const ordersUrl = new URL(
			`/client/orders/${input.orderId}`,
			this.webAppUrl,
		).toString();
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
				back_urls: {
					success: ordersUrl,
					pending: ordersUrl,
					failure: ordersUrl,
				},
				auto_return: 'approved',
			},
		});
		if (!response.id || !response.init_point)
			throw new Error('Mercado Pago preference response is invalid.');

		return {
			checkoutUrl: response.init_point,
			backUrl: ordersUrl,
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

		return this.mapPaymentResponse(response);
	}

	async fetchPaymentByExternalReference(
		externalReference: string,
	): Promise<MercadoPagoFetchPaymentNotificationOutput | null> {
		if (!this.paymentClient.search)
			throw new Error('Mercado Pago payment search is unavailable.');

		const response = await this.paymentClient.search({
			options: {
				external_reference: externalReference,
				limit: 10,
			},
		});
		const payment = this.selectPaymentSearchResult(response.results ?? []);
		if (!payment) return null;

		return this.mapPaymentResponse(payment);
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

	private mapPaymentResponse(
		response: PaymentResponse | PaymentSearchResult,
	): MercadoPagoFetchPaymentNotificationOutput {
		if (!response.id || !response.status)
			throw new Error('Mercado Pago payment response is invalid.');

		return {
			internalPaymentId: response.external_reference?.trim() ?? '',
			gatewayPaymentId: String(response.id),
			gatewayStatus: response.status,
			gatewayStatusDetail: response.status_detail ?? null,
			gatewayPaymentMethodId: this.nullableString(
				(response as { payment_method_id?: unknown }).payment_method_id,
			),
			gatewayPaymentTypeId: this.nullableString(
				(response as { payment_type_id?: unknown }).payment_type_id,
			),
		};
	}

	private nullableString(value: unknown): string | null {
		return typeof value === 'string' && value.trim() ? value.trim() : null;
	}

	private selectPaymentSearchResult(
		results: PaymentSearchResult[],
	): PaymentSearchResult | null {
		return (
			[...results].sort(
				(left, right) =>
					this.paymentSearchRank(right) - this.paymentSearchRank(left) ||
					this.paymentSearchTimestamp(right) -
						this.paymentSearchTimestamp(left) ||
					String(right.id ?? '').localeCompare(String(left.id ?? '')),
			)[0] ?? null
		);
	}

	private paymentSearchRank(payment: PaymentSearchResult): number {
		switch (payment.status) {
			case 'approved':
				return 3;
			case 'authorized':
			case 'pending':
			case 'in_process':
				return 2;
			case 'rejected':
			case 'cancelled':
				return 1;
			default:
				return 0;
		}
	}

	private paymentSearchTimestamp(payment: PaymentSearchResult): number {
		const record = payment as {
			date_approved?: unknown;
			date_last_updated?: unknown;
			date_created?: unknown;
		};
		for (const value of [
			record.date_approved,
			record.date_last_updated,
			record.date_created,
		]) {
			if (typeof value !== 'string') continue;
			const timestamp = Date.parse(value);
			if (!Number.isNaN(timestamp)) return timestamp;
		}
		return 0;
	}
}
