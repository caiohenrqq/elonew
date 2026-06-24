import { PaymentGatewayError } from '@modules/payments/domain/payment.errors';
import { MercadoPagoPaymentGatewayAdapter } from '@modules/payments/infrastructure/adapters/mercadopago-payment-gateway.adapter';
import type { MercadoPagoSdkPort } from '@packages/integrations/mercadopago/mercadopago-sdk.port';

const buildSdk = (
	overrides: Partial<MercadoPagoSdkPort>,
): MercadoPagoSdkPort => ({
	createPayment: async () => {
		throw new Error('not configured');
	},
	fetchPaymentNotification: async () => {
		throw new Error('not configured');
	},
	verifyWebhookSignature: async () => false,
	...overrides,
});

const initiate = (adapter: MercadoPagoPaymentGatewayAdapter) =>
	adapter.initiatePayment({
		paymentId: 'payment-1',
		orderId: 'order-1',
		amount: 120,
		paymentMethod: 'pix',
	});

describe('MercadoPagoPaymentGatewayAdapter', () => {
	it('wraps gateway failures with the HTTP status and cause codes', async () => {
		const sdkError = Object.assign(new Error('Bad Request'), {
			status: 400,
			cause: [
				{ code: 2034, description: 'invalid payer email' },
				'rate_limited',
			],
		});
		const adapter = new MercadoPagoPaymentGatewayAdapter(
			buildSdk({
				createPayment: async () => {
					throw sdkError;
				},
			}),
		);

		const error = await initiate(adapter).catch((thrown) => thrown);

		expect(error).toBeInstanceOf(PaymentGatewayError);
		expect(error).toMatchObject({
			operation: 'initiate_payment',
			gatewayStatus: 400,
			gatewayCause: ['2034: invalid payer email', 'rate_limited'],
			cause: sdkError,
		});
	});

	it('degrades gracefully when the gateway error has no structured fields', async () => {
		const adapter = new MercadoPagoPaymentGatewayAdapter(
			buildSdk({
				createPayment: async () => {
					throw new Error('socket hang up');
				},
			}),
		);

		const error = await initiate(adapter).catch((thrown) => thrown);

		expect(error).toBeInstanceOf(PaymentGatewayError);
		expect(error).toMatchObject({
			operation: 'initiate_payment',
			gatewayStatus: null,
			gatewayCause: [],
		});
	});
});
