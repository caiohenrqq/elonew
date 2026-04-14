import { startCheckout } from './checkout-service';

describe('startCheckout', () => {
	it('creates the quote, order, and payment through the API in sequence', async () => {
		const apiRequest = jest
			.fn()
			.mockResolvedValueOnce({
				quoteId: 'quote-1',
				subtotal: 120,
				totalAmount: 120,
				discountAmount: 0,
			})
			.mockResolvedValueOnce({
				id: 'order-1',
				status: 'awaiting_payment',
				subtotal: 120,
				totalAmount: 120,
				discountAmount: 0,
			})
			.mockResolvedValueOnce({
				id: 'payment-1',
				orderId: 'order-1',
				status: 'pending',
				grossAmount: 120,
				boosterAmount: 80,
				paymentMethod: 'pix',
				checkoutUrl: 'https://checkout.example/pay',
			});

		const result = await startCheckout(
			{
				serviceType: 'elo_boost',
				extras: ['priority'],
				currentLeague: 'silver',
				currentDivision: 'IV',
				currentLp: 0,
				desiredLeague: 'gold',
				desiredDivision: 'IV',
				server: 'BR',
				desiredQueue: 'solo_duo',
				lpGain: 20,
				deadline: '2026-05-01T00:00:00.000Z',
				paymentMethod: 'pix',
			},
			apiRequest,
		);

		expect(result).toEqual({
			checkoutUrl: 'https://checkout.example/pay',
			orderId: 'order-1',
			paymentId: 'payment-1',
		});
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/orders/quote', {
			auth: true,
			method: 'POST',
			body: expect.any(String),
		});
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/orders', {
			auth: true,
			method: 'POST',
			body: JSON.stringify({ quoteId: 'quote-1' }),
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/payments', {
			auth: true,
			method: 'POST',
			body: JSON.stringify({ orderId: 'order-1', paymentMethod: 'pix' }),
		});
	});

	it('rejects checkout URLs that are not HTTPS', async () => {
		const apiRequest = jest
			.fn()
			.mockResolvedValueOnce({
				quoteId: 'quote-1',
				subtotal: 120,
				totalAmount: 120,
				discountAmount: 0,
			})
			.mockResolvedValueOnce({
				id: 'order-1',
				status: 'awaiting_payment',
				subtotal: 120,
				totalAmount: 120,
				discountAmount: 0,
			})
			.mockResolvedValueOnce({
				id: 'payment-1',
				orderId: 'order-1',
				status: 'pending',
				grossAmount: 120,
				boosterAmount: 80,
				paymentMethod: 'pix',
				checkoutUrl: 'http://checkout.example/pay',
			});

		await expect(
			startCheckout(
				{
					serviceType: 'elo_boost',
					extras: [],
					currentLeague: 'silver',
					currentDivision: 'IV',
					currentLp: 0,
					desiredLeague: 'gold',
					desiredDivision: 'IV',
					server: 'BR',
					desiredQueue: 'solo_duo',
					lpGain: 20,
					deadline: '2026-05-01T00:00:00.000Z',
					paymentMethod: 'pix',
				},
				apiRequest,
			),
		).rejects.toThrow('Não foi possível iniciar o pagamento com segurança.');
	});
});
