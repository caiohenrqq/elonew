import {
	type ClientDashboardOrdersOutput,
	type CreateOrderOutput,
	type CreatePaymentOutput,
	clientDashboardOrdersSchema,
	createOrderSchema,
	createPaymentSchema,
	type GetOrderOutput,
	type OrderQuoteOutput,
	type OrderQuotePreviewOutput,
	orderQuoteSchema,
	type ResumePaymentCheckoutOutput,
	resumePaymentCheckoutSchema,
	type StartCheckoutInput,
	startCheckoutSchema,
} from './order-contracts';

export type AuthenticatedApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => Promise<T>;

export const createOrderQuote = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
) => {
	const body = orderQuoteSchema.parse(input);

	return await apiRequest<OrderQuoteOutput>('/orders/quote', {
		auth: true,
		method: 'POST',
		body: JSON.stringify(body),
	});
};

export const getClientDashboardOrders = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<ClientDashboardOrdersOutput> => {
	const response = await apiRequest<unknown>('/orders?limit=10', {
		auth: true,
	});

	return clientDashboardOrdersSchema.parse(response);
};

export const previewOrderQuote = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
) => {
	const { paymentMethod: _paymentMethod, ...body } =
		startCheckoutSchema.parse(input);

	return await apiRequest<OrderQuotePreviewOutput>('/orders/quote/preview', {
		auth: true,
		method: 'POST',
		body: JSON.stringify(body),
	});
};

export const createOrder = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
) => {
	const body = createOrderSchema.parse(input);

	return await apiRequest<CreateOrderOutput>('/orders', {
		auth: true,
		method: 'POST',
		body: JSON.stringify(body),
	});
};

export const createPayment = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
) => {
	const body = createPaymentSchema.parse(input);

	return await apiRequest<CreatePaymentOutput>('/payments', {
		auth: true,
		method: 'POST',
		body: JSON.stringify(body),
	});
};

export const getOrder = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
) => {
	return await apiRequest<GetOrderOutput>(
		`/orders/${encodeURIComponent(orderId)}`,
		{ auth: true },
	);
};

export const resumePaymentCheckout = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<ResumePaymentCheckoutOutput> => {
	const response = await apiRequest<unknown>(
		`/payments/orders/${encodeURIComponent(orderId)}/resume`,
		{
			auth: true,
			method: 'POST',
		},
	);

	const payment = resumePaymentCheckoutSchema.parse(response);
	return {
		...payment,
		checkoutUrl: getSafeCheckoutUrl(payment.checkoutUrl),
	};
};

export const startCheckout = async (
	input: StartCheckoutInput,
	apiRequest: AuthenticatedApiRequest,
) => {
	const { paymentMethod, ...quoteInput } = startCheckoutSchema.parse(input);
	const quote = await createOrderQuote(quoteInput, apiRequest);
	const order = await createOrder({ quoteId: quote.quoteId }, apiRequest);
	const payment = await createPayment(
		{ orderId: order.id, paymentMethod },
		apiRequest,
	);

	return {
		checkoutUrl: getSafeCheckoutUrl(payment.checkoutUrl),
		orderId: order.id,
		paymentId: payment.id,
	};
};

const getSafeCheckoutUrl = (checkoutUrl: string) => {
	const url = new URL(checkoutUrl);
	const isLocalDevUrl =
		process.env.NODE_ENV !== 'production' &&
		url.protocol === 'http:' &&
		(url.hostname === 'localhost' || url.hostname === '127.0.0.1');

	if (url.protocol !== 'https:' && !isLocalDevUrl) {
		throw new Error('Não foi possível iniciar o pagamento com segurança.');
	}

	return url.toString();
};

export const getSafeCheckoutRedirectUrl = getSafeCheckoutUrl;
