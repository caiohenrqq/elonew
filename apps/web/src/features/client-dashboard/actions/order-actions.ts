'use server';

import { api } from '@/shared/api-client-management/api-client';
import { getCheckoutErrorMessage } from '@/shared/api-client-management/user-messages';
import { assertSameOriginRequest } from '@/shared/security/origin';
import {
	getOrder as getOrderFromApi,
	startCheckout,
} from '../server/checkout-service';
import {
	type GetOrderOutput,
	type StartCheckoutInput,
	startCheckoutSchema,
} from '../server/order-contracts';

export type CheckoutActionState = {
	checkoutUrl?: string;
	orderId?: string;
	paymentId?: string;
	error?: string;
};

export const startCheckoutAction = async (
	input: StartCheckoutInput,
): Promise<CheckoutActionState> => {
	const parsed = startCheckoutSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	try {
		await assertSameOriginRequest();
		return await startCheckout(parsed.data, api.request);
	} catch (error) {
		return {
			error: getCheckoutErrorMessage(error),
		};
	}
};

export const getOrder = async (orderId: string): Promise<GetOrderOutput> => {
	return await getOrderFromApi(orderId, (path, init) =>
		api.request(path, { ...init, allowSessionRefresh: false }),
	);
};
