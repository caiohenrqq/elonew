import {
	type CreateOrderOutput,
	type CreatePaymentOutput,
	createOrderSchema,
	createPaymentSchema,
	type GetOrderOutput,
	type OrderQuoteOutput,
	orderQuoteSchema,
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
	if (url.protocol !== 'https:') {
		throw new Error('Não foi possível iniciar o pagamento com segurança.');
	}

	return url.toString();
};
