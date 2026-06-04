import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import { DevPaymentGatewayAdapter } from '@modules/payments/infrastructure/adapters/dev-payment-gateway.adapter';

describe('DevPaymentGatewayAdapter', () => {
	it('returns a local simulation reference instead of creating a Mercado Pago checkout', async () => {
		const adapter = new DevPaymentGatewayAdapter({
			devCheckoutAppUrl: 'http://localhost:3001',
		} as AppSettingsService);

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

	it('uses the configured app URL for local simulation checkout links', async () => {
		const adapter = new DevPaymentGatewayAdapter({
			devCheckoutAppUrl: 'https://beta.elonew.com.br',
		} as AppSettingsService);

		await expect(
			adapter.initiatePayment({
				paymentId: 'payment 1',
				orderId: 'order-1',
				amount: 100,
				paymentMethod: 'pix',
			}),
		).resolves.toMatchObject({
			checkoutUrl: 'https://beta.elonew.com.br/client?devPaymentId=payment+1',
		});
	});
});
