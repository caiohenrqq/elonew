import { mercadoPagoWebhookSchema } from './payments.request-schemas';

describe('payments request schemas', () => {
	it('accepts numeric Mercado Pago webhook ids', () => {
		expect(
			mercadoPagoWebhookSchema.parse({
				id: 12345,
				type: 'payment',
				action: 'payment.created',
				data: { id: 999999999 },
			}),
		).toEqual({
			id: '12345',
			type: 'payment',
			action: 'payment.created',
			data: { id: '999999999' },
		});
	});
});
