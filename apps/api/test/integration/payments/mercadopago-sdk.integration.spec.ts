import { createHmac } from 'node:crypto';
import { MercadoPagoSdkAdapter } from '@integrations/mercadopago/mercadopago-sdk.adapter';

describe('MercadoPagoSdkAdapter', () => {
	it('verifies a valid webhook signature', async () => {
		const adapter = new MercadoPagoSdkAdapter('webhook-secret');
		const manifest = 'id:payment-1;request-id:request-1;ts:1710000000;';
		const signature = createHmac('sha256', 'webhook-secret')
			.update(manifest)
			.digest('hex');

		await expect(
			adapter.verifyWebhookSignature({
				payload: {
					eventId: 'event-1',
					topic: 'payment',
					resourceId: 'payment-1',
				},
				requestId: 'request-1',
				signature: `ts=1710000000,v1=${signature}`,
			}),
		).resolves.toBe(true);
	});

	it('rejects invalid webhook signatures', async () => {
		const adapter = new MercadoPagoSdkAdapter('webhook-secret');

		await expect(
			adapter.verifyWebhookSignature({
				payload: {
					eventId: 'event-1',
					topic: 'payment',
					resourceId: 'payment-1',
				},
				requestId: 'request-1',
				signature: 'ts=1710000000,v1=invalid',
			}),
		).resolves.toBe(false);
	});
});
