'use server';

import { Money } from '@packages/shared/money/money';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getCheckoutErrorMessage } from '@/shared/api-client-management/user-messages';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import type { AuthSession } from '@/shared/auth/session';
import { getAuthSession } from '@/shared/auth/session';
import { type ListChatMessagesResponseOutput } from '@/shared/chat/chat-contracts';
import { listOrderChatMessages } from '@/shared/chat/chat-service';
import { assertSameOriginRequest } from '@/shared/security/origin';
import type {
	BoosterOrderOutput,
	BoosterQueueOutput,
	BoosterWalletOutput,
	BoosterWalletTransactionsOutput,
	BoosterWorkOutput,
	OrderCredentialsOutput,
} from '../server/booster-contracts';
import { acceptBoosterOrderSchema } from '../server/booster-contracts';
import {
	acceptBoosterOrder,
	completeBoosterOrder,
	getBoosterQueue as getBoosterQueueFromApi,
	getBoosterWallet as getBoosterWalletFromApi,
	getBoosterWalletTransactions as getBoosterWalletTransactionsFromApi,
	getBoosterWork as getBoosterWorkFromApi,
	rejectBoosterOrder,
	requestBoosterWithdrawal,
	revealBoosterOrderCredentials,
} from '../server/booster-service';

export type BoosterActionState = {
	error?: string;
	success?: boolean;
};

export type RevealCredentialsActionState =
	| { credentials: OrderCredentialsOutput; error?: never }
	| { error: string; credentials?: never };

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

export const getBoosterUserId = async () => {
	const session = await getBoosterSessionOrRedirect();
	return session.userId;
};

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

export const getBoosterOrder = async (
	orderId: string,
): Promise<BoosterOrderOutput | null> => {
	const work = await getBoosterWork();
	return (
		[...work.activeOrders, ...work.recentCompletedOrders].find(
			(order) => order.id === orderId,
		) ?? null
	);
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

export const getBoosterOrderChatMessages = async (
	orderId: string,
): Promise<ListChatMessagesResponseOutput> => {
	await getBoosterSessionOrRedirect();

	try {
		return await listOrderChatMessages(orderId, renderReadApiRequest);
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 404)
			return { items: [], nextCursor: null };

		return redirectOnAuthError(error);
	}
};

export const revealBoosterOrderCredentialsAction = async (
	orderId: string,
): Promise<RevealCredentialsActionState> => {
	try {
		await assertSameOriginRequest();
		await getBoosterSessionOrRedirect();
		return {
			credentials: await revealBoosterOrderCredentials(orderId, api.request),
		};
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 429)
			return { error: error.message };
		if (error instanceof ApiRequestError && error.status === 404)
			return { error: 'Credenciais indisponíveis para este pedido.' };
		return { error: 'Não foi possível revelar as credenciais.' };
	}
};

export const acceptBoosterOrderAction = async (
	orderId: string,
	formData: FormData,
): Promise<void> => {
	const deadline = formData.get('deadline');
	if (
		typeof deadline !== 'string' ||
		!acceptBoosterOrderSchema.safeParse({ deadline }).success
	)
		throw new Error('Prazo inválido.');

	await assertSameOriginRequest();
	await getBoosterSessionOrRedirect();
	await acceptBoosterOrder(orderId, { deadline }, api.request);
	redirect(`/booster/orders/${encodeURIComponent(orderId)}`);
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
	const amountInReais = Number(formData.get('amount'));
	const amount = Number.isFinite(amountInReais)
		? Money.fromDecimal(amountInReais).cents
		: Number.NaN;

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
