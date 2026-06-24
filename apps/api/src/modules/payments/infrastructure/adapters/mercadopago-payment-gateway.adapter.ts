import type {
	FetchPaymentNotificationInput,
	FetchPaymentNotificationOutput,
	InitiatePaymentInput,
	InitiatePaymentOutput,
	PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import { PaymentGatewayError } from '@modules/payments/domain/payment.errors';
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
		try {
			return await this.mercadoPagoSdk.createPayment(input);
		} catch (error) {
			throw toGatewayError('initiate_payment', error);
		}
	}

	async fetchPaymentNotification(
		input: FetchPaymentNotificationInput,
	): Promise<FetchPaymentNotificationOutput> {
		try {
			return await this.mercadoPagoSdk.fetchPaymentNotification({
				notificationId: input.notificationId,
			});
		} catch (error) {
			throw toGatewayError('fetch_notification', error);
		}
	}
}

function toGatewayError(
	operation: 'initiate_payment' | 'fetch_notification',
	error: unknown,
): PaymentGatewayError {
	if (error instanceof PaymentGatewayError) return error;

	return new PaymentGatewayError(
		operation,
		extractGatewayStatus(error),
		extractGatewayCause(error),
		error,
	);
}

function extractGatewayStatus(error: unknown): number | null {
	if (typeof error !== 'object' || error === null) return null;

	const candidate = error as { status?: unknown; statusCode?: unknown };
	const status = candidate.status ?? candidate.statusCode;
	return typeof status === 'number' ? status : null;
}

function extractGatewayCause(error: unknown): string[] {
	if (typeof error !== 'object' || error === null) return [];

	const cause = (error as { cause?: unknown }).cause;
	if (!Array.isArray(cause)) return [];

	return cause
		.map((entry) => {
			if (typeof entry === 'string') return entry;
			if (typeof entry === 'object' && entry !== null) {
				const { code, description } = entry as {
					code?: unknown;
					description?: unknown;
				};
				if (code !== undefined || description !== undefined)
					return `${String(code ?? 'unknown')}: ${String(description ?? '')}`.trim();
			}
			return '';
		})
		.filter((entry) => entry.length > 0);
}
