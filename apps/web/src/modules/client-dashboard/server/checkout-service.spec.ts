import {
	getClientDashboardOrders,
	previewOrderQuote,
	startCheckout,
} from './checkout-service';

describe('getClientDashboardOrders', () => {
	it('requests recent client orders with dashboard summary', async () => {
		const apiRequest = jest.fn().mockResolvedValueOnce({
			orders: [
				{
					id: 'order-1',
					status: 'awaiting_payment',
					serviceType: 'elo_boost',
					currentLeague: 'gold',
					currentDivision: 'II',
					currentLp: 40,
					desiredLeague: 'platinum',
					desiredDivision: 'IV',
					server: 'br',
					desiredQueue: 'solo_duo',
					lpGain: 20,
					deadline: '2026-05-01T00:00:00.000Z',
					subtotal: 120,
					totalAmount: 120,
					discountAmount: 0,
					createdAt: '2026-04-01T00:00:00.000Z',
				},
			],
			summary: {
				activeOrders: 1,
				totalOrders: 1,
				totalInvested: 120,
			},
		});

		const result = await getClientDashboardOrders(apiRequest);

		expect(result.summary).toEqual({
			activeOrders: 1,
			totalOrders: 1,
			totalInvested: 120,
		});
		expect(result.orders).toHaveLength(1);
		expect(apiRequest).toHaveBeenCalledWith('/orders?limit=10', {
			auth: true,
		});
	});
});

describe('previewOrderQuote', () => {
	it('requests non-persistent quote preview pricing', async () => {
		const apiRequest = jest.fn().mockResolvedValueOnce({
			subtotal: 120,
			totalAmount: 108,
			discountAmount: 12,
			extras: [{ type: 'priority_service', price: 10 }],
		});

		const result = await previewOrderQuote(
			{
				serviceType: 'elo_boost',
				extras: ['priority_service'],
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
				couponCode: 'WELCOME10',
			},
			apiRequest,
		);

		expect(result).toEqual({
			subtotal: 120,
			totalAmount: 108,
			discountAmount: 12,
			extras: [{ type: 'priority_service', price: 10 }],
		});
		expect(apiRequest).toHaveBeenCalledWith('/orders/quote/preview', {
			auth: true,
			method: 'POST',
			body: expect.any(String),
		});
	});
});

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
