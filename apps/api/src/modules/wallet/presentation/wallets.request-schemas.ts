import { z } from 'zod';

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
