'use server';

import { api } from '@/shared/api-client-management/api-client';
import { getCheckoutErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import { getAuthSession } from '@/shared/auth/session';
import { assertSameOriginRequest } from '@/shared/security/origin';
import {
	getClientDashboardOrders as getClientDashboardOrdersFromApi,
	getOrder as getOrderFromApi,
	previewOrderQuote,
	startCheckout,
} from '../server/checkout-service';
import {
	type ClientDashboardOrdersOutput,
	type GetOrderOutput,
	type OrderQuotePreviewOutput,
	type StartCheckoutInput,
	startCheckoutSchema,
} from '../server/order-contracts';

export type CheckoutActionState = {
	checkoutUrl?: string;
	orderId?: string;
	paymentId?: string;
	error?: string;
};

export type QuotePreviewActionState =
	| {
			quote: OrderQuotePreviewOutput;
			error?: never;
	  }
	| {
			error: string;
			quote?: never;
	  };

export const previewOrderQuoteAction = async (
	input: StartCheckoutInput,
): Promise<QuotePreviewActionState> => {
	const parsed = startCheckoutSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		return { quote: await previewOrderQuote(parsed.data, api.request) };
	} catch (error) {
		return {
			error: getCheckoutErrorMessage(error),
		};
	}
};

export const startCheckoutAction = async (
	input: StartCheckoutInput,
): Promise<CheckoutActionState> => {
	const parsed = startCheckoutSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();
		return await startCheckout(parsed.data, api.request);
	} catch (error) {
		return {
			error: getCheckoutErrorMessage(error),
		};
	}
};

export const getOrder = async (orderId: string): Promise<GetOrderOutput> => {
	try {
		return await getOrderFromApi(orderId, (path, init) =>
			api.request(path, { ...init, allowSessionRefresh: false }),
		);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getClientDashboardOrders =
	async (): Promise<ClientDashboardOrdersOutput> => {
		try {
			return await getClientDashboardOrdersFromApi((path, init) =>
				api.request(path, { ...init, allowSessionRefresh: false }),
			);
		} catch (error) {
			return redirectOnAuthError(error);
		}
	};
