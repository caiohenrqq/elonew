import { createHmac } from 'node:crypto';
import { MercadoPagoSdkAdapter } from '@packages/integrations/mercadopago/mercadopago-sdk.adapter';

describe('MercadoPagoSdkAdapter', () => {
	it('creates a checkout preference and returns the checkout url plus gateway reference id', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
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
			backUrl: 'https://app.elonew.test/client/orders/order-1',
			gatewayReferenceId: 'pref-1',
			gatewayStatus: null,
		});
	});

	it('offers every payment method by not restricting payment types', async () => {
		const create = jest.fn().mockResolvedValue({
			id: 'pref-all',
			init_point: 'https://mercadopago.test/checkout/pref-all',
		});
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
			preferenceClient: {
				create,
			},
			paymentClient: {
				get: jest.fn(),
			},
		});

		await adapter.createPayment({
			paymentId: 'payment-all',
			orderId: 'order-all',
			amount: 100,
			paymentMethod: 'pix',
		});

		expect(create).toHaveBeenCalledWith({
			body: expect.not.objectContaining({
				payment_methods: expect.anything(),
			}),
		});
	});

	it('sends back_urls and auto_return so the buyer returns to their order page', async () => {
		const create = jest.fn().mockResolvedValue({
			id: 'pref-back',
			init_point: 'https://mercadopago.test/checkout/pref-back',
		});
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
			preferenceClient: {
				create,
			},
			paymentClient: {
				get: jest.fn(),
			},
		});

		await adapter.createPayment({
			paymentId: 'payment-back',
			orderId: 'order-back',
			amount: 100,
			paymentMethod: 'pix',
		});

		const ordersUrl = 'https://app.elonew.test/client/orders/order-back';
		expect(create).toHaveBeenCalledWith({
			body: expect.objectContaining({
				back_urls: {
					success: ordersUrl,
					pending: ordersUrl,
					failure: ordersUrl,
				},
				auto_return: 'approved',
			}),
		});
	});

	it('fetches a payment notification and maps provider fields to the internal contract', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
			preferenceClient: {
				create: jest.fn(),
			},
			paymentClient: {
				get: jest.fn().mockResolvedValue({
					id: 123,
					status: 'approved',
					status_detail: 'accredited',
					external_reference: 'payment-1',
					payment_method_id: 'pix',
					payment_type_id: 'bank_transfer',
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
			gatewayPaymentMethodId: 'pix',
			gatewayPaymentTypeId: 'bank_transfer',
		});
	});

	it('searches a payment by external reference for stale reconciliation', async () => {
		const search = jest.fn().mockResolvedValue({
			results: [
				{
					id: 456,
					status: 'pending',
					status_detail: 'pending_waiting_transfer',
					external_reference: 'payment-search',
					payment_method_id: 'pix',
					payment_type_id: 'bank_transfer',
				},
			],
		});
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
			preferenceClient: {
				create: jest.fn(),
			},
			paymentClient: {
				get: jest.fn(),
				search,
			},
		});

		await expect(
			adapter.fetchPaymentByExternalReference('payment-search'),
		).resolves.toEqual({
			internalPaymentId: 'payment-search',
			gatewayPaymentId: '456',
			gatewayStatus: 'pending',
			gatewayStatusDetail: 'pending_waiting_transfer',
			gatewayPaymentMethodId: 'pix',
			gatewayPaymentTypeId: 'bank_transfer',
		});
		expect(search).toHaveBeenCalledWith({
			options: {
				external_reference: 'payment-search',
				limit: 10,
			},
		});
	});

	it('prefers an approved searched payment over older pending attempts', async () => {
		const search = jest.fn().mockResolvedValue({
			results: [
				{
					id: 456,
					status: 'pending',
					status_detail: 'pending_waiting_transfer',
					external_reference: 'payment-search',
					date_last_updated: '2026-07-09T17:10:00.000Z',
				},
				{
					id: 789,
					status: 'approved',
					status_detail: 'accredited',
					external_reference: 'payment-search',
					payment_method_id: 'pix',
					payment_type_id: 'bank_transfer',
					date_approved: '2026-07-09T17:00:00.000Z',
				},
			],
		});
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
			preferenceClient: {
				create: jest.fn(),
			},
			paymentClient: {
				get: jest.fn(),
				search,
			},
		});

		await expect(
			adapter.fetchPaymentByExternalReference('payment-search'),
		).resolves.toMatchObject({
			gatewayPaymentId: '789',
			gatewayStatus: 'approved',
		});
	});

	it('verifies a valid webhook signature', async () => {
		const adapter = new MercadoPagoSdkAdapter({
			accessToken: 'mp-access-token',
			webhookSecret: 'webhook-secret',
			webhookUrl: 'https://example.com/payments/webhooks/mercadopago',
			webAppUrl: 'https://app.elonew.test',
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
			webAppUrl: 'https://app.elonew.test',
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
