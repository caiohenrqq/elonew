import { createHmac } from 'node:crypto';
import { MercadoPagoSdkAdapter } from '@packages/integrations/mercadopago/mercadopago-sdk.adapter';

describe('MercadoPagoSdkAdapter', () => {
	it('creates a checkout preference and returns the checkout url plus gateway reference id', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			preferenceClient: {
				create: jest.fn().mockResolvedValue({
					id: 'pref-1',
					init_point: 'https://mercadopago.test/checkout/pref-1',
				}),
			},
			paymentClient: {
				get: jest.fn(),
			},
		});

		await expect(
			adapter.createPayment({
				paymentId: 'payment-1',
				orderId: 'order-1',
				amount: 100,
				paymentMethod: 'pix',
			}),
		).resolves.toEqual({
			checkoutUrl: 'https://mercadopago.test/checkout/pref-1',
			gatewayReferenceId: 'pref-1',
			gatewayStatus: null,
		});
	});

	it('fetches a payment notification and maps provider fields to the internal contract', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			preferenceClient: {
				create: jest.fn(),
			},
			paymentClient: {
				get: jest.fn().mockResolvedValue({
					id: 123,
					status: 'approved',
					status_detail: 'accredited',
					external_reference: 'payment-1',
				}),
			},
		});

		await expect(
			adapter.fetchPaymentNotification({
				notificationId: '123',
			}),
		).resolves.toEqual({
			internalPaymentId: 'payment-1',
			gatewayPaymentId: '123',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
			isApproved: true,
		});
	});

	it('verifies a valid webhook signature', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			preferenceClient: {
				create: jest.fn(),
			},
			paymentClient: {
				get: jest.fn(),
			},
		});
		const manifest = 'id:payment-1;request-id:request-1;ts:1710000000;';
		const signature = createHmac('sha256', 'webhook-secret')
			.update(manifest)
			.digest('hex');

		await expect(
			adapter.verifyWebhookSignature({
				payload: {
					eventId: 'event-1',
					topic: 'payment.updated',
					resourceId: 'payment-1',
				},
				requestId: 'request-1',
				signature: `ts=1710000000,v1=${signature}`,
			}),
		).resolves.toBe(true);
	});

	it('rejects invalid webhook signatures', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			preferenceClient: {
				create: jest.fn(),
			},
			paymentClient: {
				get: jest.fn(),
			},
		});

		await expect(
			adapter.verifyWebhookSignature({
				payload: {
					eventId: 'event-1',
					topic: 'payment.updated',
					resourceId: 'payment-1',
				},
				requestId: 'request-1',
				signature: 'ts=1710000000,v1=invalid',
			}),
		).resolves.toBe(false);
	});
});
