import { z } from 'zod';

export const boosterOrderSchema = z.object({
	id: z.string(),
	boosterId: z.string().nullable(),
	status: z.string(),
	serviceType: z.string().nullable(),
	currentLeague: z.string().nullable(),
	currentDivision: z.string().nullable(),
	currentLp: z.number().nullable(),
	desiredLeague: z.string().nullable(),
	desiredDivision: z.string().nullable(),
	server: z.string().nullable(),
	desiredQueue: z.string().nullable(),
	lpGain: z.number().nullable(),
	deadline: z.string().nullable(),
	totalAmount: z.number().nullable(),
	boosterAmount: z.number(),
	createdAt: z.string(),
});

export const boosterQueueSchema = z.object({
	availableOrders: z.array(boosterOrderSchema),
	summary: z.object({
		availableOrders: z.number().int().nonnegative(),
		estimatedAvailableEarnings: z.number().nonnegative(),
	}),
});

export const boosterWorkSchema = z.object({
	activeOrders: z.array(boosterOrderSchema),
	recentCompletedOrders: z.array(boosterOrderSchema),
	summary: z.object({
		activeOrders: z.number().int().nonnegative(),
		completedOrders: z.number().int().nonnegative(),
		earnedFromRecentCompletions: z.number().nonnegative(),
	}),
});

export const boosterWalletSchema = z.object({
	boosterId: z.string(),
	balanceLocked: z.number().nonnegative(),
	balanceWithdrawable: z.number().nonnegative(),
});

export const boosterWalletTransactionSchema = z.object({
	id: z.string(),
	orderId: z.string().nullable(),
	amount: z.number(),
	type: z.enum(['credit', 'debit']),
	reason: z.enum(['order_completion', 'withdrawal_request']),
	availableAt: z.string(),
	releasedAt: z.string().nullable(),
	createdAt: z.string(),
});

export const boosterWalletTransactionsSchema = z.object({
	transactions: z.array(boosterWalletTransactionSchema),
});

export const withdrawalRequestSchema = z.object({
	amount: z.number().positive(),
});

export type BoosterQueueOutput = z.infer<typeof boosterQueueSchema>;
export type BoosterWorkOutput = z.infer<typeof boosterWorkSchema>;
export type BoosterOrderOutput = z.infer<typeof boosterOrderSchema>;
export type BoosterWalletOutput = z.infer<typeof boosterWalletSchema>;
export type BoosterWalletTransactionOutput = z.infer<
	typeof boosterWalletTransactionSchema
>;
export type BoosterWalletTransactionsOutput = z.infer<
	typeof boosterWalletTransactionsSchema
>;
