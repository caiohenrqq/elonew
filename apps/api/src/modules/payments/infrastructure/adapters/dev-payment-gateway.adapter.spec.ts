import { DevPaymentGatewayAdapter } from '@modules/payments/infrastructure/adapters/dev-payment-gateway.adapter';

describe('DevPaymentGatewayAdapter', () => {
	it('returns a local simulation reference instead of creating a Mercado Pago checkout', async () => {
		const adapter = new DevPaymentGatewayAdapter();

		await expect(
			adapter.initiatePayment({
				paymentId: 'payment-1',
				orderId: 'order-1',
				amount: 100,
				paymentMethod: 'pix',
			}),
		).resolves.toEqual({
			checkoutUrl: 'http://localhost:3001/client?devPaymentId=payment-1',
			gatewayReferenceId: 'dev-payment-1',
			gatewayStatus: 'pending',
		});
	});
});
