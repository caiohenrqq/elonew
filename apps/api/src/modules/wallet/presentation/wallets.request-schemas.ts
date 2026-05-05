import { z } from 'zod';

export const boosterIdParamSchema = z.string().trim().min(1);

export type BoosterIdParamSchemaInput = z.infer<typeof boosterIdParamSchema>;

export const listWalletTransactionsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListWalletTransactionsQuerySchemaInput = z.infer<
	typeof listWalletTransactionsQuerySchema
>;

export const creditCompletedOrderEarningsSchema = z.object({
	orderId: z.string().trim().min(1),
	boosterId: z.string().trim().min(1),
	amount: z.number().positive(),
	completedAt: z.string().datetime(),
	lockPeriodInHours: z.number().int().nonnegative(),
});

export type CreditCompletedOrderEarningsSchemaInput = z.infer<
	typeof creditCompletedOrderEarningsSchema
>;

export const releaseMaturedWalletFundsSchema = z.object({
	orderId: z.string().trim().min(1),
	boosterId: z.string().trim().min(1),
	now: z.string().datetime(),
});

export type ReleaseMaturedWalletFundsSchemaInput = z.infer<
	typeof releaseMaturedWalletFundsSchema
>;

export const requestWithdrawalSchema = z.object({
	amount: z.number().positive(),
	requestedAt: z.string().datetime(),
});

export type RequestWithdrawalSchemaInput = z.infer<
	typeof requestWithdrawalSchema
>;
