import { z } from 'zod';

export const adminCouponSummarySchema = z.object({
	id: z.string(),
	code: z.string(),
	discountType: z.enum(['percentage', 'fixed']),
	discount: z.number(),
	isActive: z.boolean(),
	firstOrderOnly: z.boolean(),
	allowedServiceTypes: z.array(z.string()),
	allowedQueues: z.array(z.string()),
	allowedEmails: z.array(z.string()),
	minSubtotal: z.number().nullable(),
	maxSubtotal: z.number().nullable(),
	minRankIndex: z.number().nullable(),
	maxRankIndex: z.number().nullable(),
	minExtrasCount: z.number().nullable(),
	requiredExtra: z.string().nullable(),
	globalUsageLimit: z.number().nullable(),
	perUserUsageLimit: z.number().nullable(),
	usageCount: z.number().int().nonnegative(),
	createdAt: z.coerce.string(),
});

export const adminCouponReportSchema = z.object({
	couponId: z.string(),
	code: z.string(),
	usageCount: z.number().int().nonnegative(),
	discountTotalCents: z.number().int().nonnegative(),
	revenueCents: z.number().int().nonnegative(),
	uniqueClients: z.number().int().nonnegative(),
	appliedCount: z.number().int().nonnegative(),
	conversionRate: z.number(),
	eventCounts: z.record(z.string(), z.number()),
});

export type AdminCouponSummaryOutput = z.infer<typeof adminCouponSummarySchema>;
export type AdminCouponReportOutput = z.infer<typeof adminCouponReportSchema>;

export type CreateCouponPayload = {
	code?: string;
	discountType: 'percentage' | 'fixed';
	discount: number;
	firstOrderOnly: boolean;
	allowedServiceTypes: string[];
	allowedQueues: string[];
	allowedEmails: string[];
	minSubtotal?: number;
	maxSubtotal?: number;
	minRank?: { league: string; division: string };
	maxRank?: { league: string; division: string };
	minExtrasCount?: number;
	requiredExtra?: string;
	globalUsageLimit?: number;
	perUserUsageLimit?: number;
};
