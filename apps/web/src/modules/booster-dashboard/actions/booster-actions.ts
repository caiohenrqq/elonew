'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api-client-management/api-client';
import { getCheckoutErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import type { AuthSession } from '@/shared/auth/session';
import { getAuthSession } from '@/shared/auth/session';
import { assertSameOriginRequest } from '@/shared/security/origin';
import type {
	BoosterQueueOutput,
	BoosterWalletOutput,
	BoosterWalletTransactionsOutput,
	BoosterWorkOutput,
} from '../server/booster-contracts';
import {
	acceptBoosterOrder,
	completeBoosterOrder,
	getBoosterQueue as getBoosterQueueFromApi,
	getBoosterWallet as getBoosterWalletFromApi,
	getBoosterWalletTransactions as getBoosterWalletTransactionsFromApi,
	getBoosterWork as getBoosterWorkFromApi,
	rejectBoosterOrder,
	requestBoosterWithdrawal,
} from '../server/booster-service';

export type BoosterActionState = {
	error?: string;
	success?: boolean;
};

const getBoosterSessionOrRedirect = async () => {
	const session = await getAuthSession();
	if (!session || session.userRole !== 'BOOSTER' || !session.userId)
		redirect('/login');
	return session as AuthSession & { userId: string };
};

const renderReadApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => api.request<T>(path, { ...init, allowSessionRefresh: false });

export const getBoosterQueue = async (): Promise<BoosterQueueOutput> => {
	await getBoosterSessionOrRedirect();
	try {
		return await getBoosterQueueFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getBoosterWork = async (): Promise<BoosterWorkOutput> => {
	await getBoosterSessionOrRedirect();
	try {
		return await getBoosterWorkFromApi(renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getBoosterWallet = async (): Promise<BoosterWalletOutput> => {
	const session = await getBoosterSessionOrRedirect();
	try {
		return await getBoosterWalletFromApi(session.userId, renderReadApiRequest);
	} catch (error) {
		return redirectOnAuthError(error);
	}
};

export const getBoosterWalletTransactions =
	async (): Promise<BoosterWalletTransactionsOutput> => {
		const session = await getBoosterSessionOrRedirect();
		try {
			return await getBoosterWalletTransactionsFromApi(
				session.userId,
				renderReadApiRequest,
			);
		} catch (error) {
			return redirectOnAuthError(error);
		}
	};

export const acceptBoosterOrderAction = async (
	orderId: string,
): Promise<void> => {
	await assertSameOriginRequest();
	await getBoosterSessionOrRedirect();
	await acceptBoosterOrder(orderId, api.request);
	revalidatePath('/booster');
};

export const rejectBoosterOrderAction = async (
	orderId: string,
): Promise<void> => {
	await assertSameOriginRequest();
	await getBoosterSessionOrRedirect();
	await rejectBoosterOrder(orderId, api.request);
	revalidatePath('/booster');
};

export const completeBoosterOrderAction = async (
	orderId: string,
): Promise<void> => {
	await assertSameOriginRequest();
	await getBoosterSessionOrRedirect();
	await completeBoosterOrder(orderId, api.request);
	revalidatePath('/booster');
};

export const requestBoosterWithdrawalAction = async (
	_state: BoosterActionState,
	formData: FormData,
): Promise<BoosterActionState> => {
	const amount = Number(formData.get('amount'));

	try {
		await assertSameOriginRequest();
		const session = await getBoosterSessionOrRedirect();
		await requestBoosterWithdrawal(session.userId, { amount }, api.request);
		revalidatePath('/booster');
		return { success: true };
	} catch (error) {
		return { error: getCheckoutErrorMessage(error) };
	}
};
