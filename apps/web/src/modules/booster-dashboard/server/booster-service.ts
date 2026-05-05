import { ApiRequestError } from '@/shared/api-client-management/http';
import {
	type BoosterQueueOutput,
	type BoosterWalletOutput,
	type BoosterWalletTransactionsOutput,
	type BoosterWorkOutput,
	boosterQueueSchema,
	boosterWalletSchema,
	boosterWalletTransactionsSchema,
	boosterWorkSchema,
	withdrawalRequestSchema,
} from './booster-contracts';

export type AuthenticatedApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => Promise<T>;

export const getBoosterQueue = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<BoosterQueueOutput> => {
	const response = await apiRequest<unknown>('/orders/booster/queue', {
		auth: true,
	});

	return boosterQueueSchema.parse(response);
};

export const getBoosterWork = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<BoosterWorkOutput> => {
	const response = await apiRequest<unknown>('/orders/booster/work', {
		auth: true,
	});

	return boosterWorkSchema.parse(response);
};

export const getBoosterWallet = async (
	boosterId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<BoosterWalletOutput> => {
	try {
		const response = await apiRequest<unknown>(
			`/wallets/${encodeURIComponent(boosterId)}`,
			{ auth: true },
		);

		return boosterWalletSchema.parse(response);
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 404) {
			return {
				boosterId,
				balanceLocked: 0,
				balanceWithdrawable: 0,
			};
		}

		throw error;
	}
};

export const getBoosterWalletTransactions = async (
	boosterId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<BoosterWalletTransactionsOutput> => {
	try {
		const response = await apiRequest<unknown>(
			`/wallets/${encodeURIComponent(boosterId)}/transactions?limit=10`,
			{ auth: true },
		);

		return boosterWalletTransactionsSchema.parse(response);
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 404) {
			return { transactions: [] };
		}

		throw error;
	}
};

export const acceptBoosterOrder = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	await apiRequest(`/orders/${encodeURIComponent(orderId)}/accept`, {
		auth: true,
		method: 'POST',
	});
};

export const rejectBoosterOrder = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	await apiRequest(`/orders/${encodeURIComponent(orderId)}/reject`, {
		auth: true,
		method: 'POST',
	});
};

export const completeBoosterOrder = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	await apiRequest(`/orders/${encodeURIComponent(orderId)}/complete`, {
		auth: true,
		method: 'POST',
	});
};

export const requestBoosterWithdrawal = async (
	boosterId: string,
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<void> => {
	const body = withdrawalRequestSchema.parse(input);

	await apiRequest(`/wallets/${encodeURIComponent(boosterId)}/withdrawals`, {
		auth: true,
		method: 'POST',
		body: JSON.stringify({
			amount: body.amount,
			requestedAt: new Date().toISOString(),
		}),
	});
};
