import { z } from 'zod';
import { orderExtraTypes } from '../orders/order-extra';
import { findOrderRankIndex } from '../orders/order-rank-progression';
import { orderServiceTypes } from '../orders/service-type';
import {
	COUPON_CODE_MAX_LENGTH,
	COUPON_CODE_MIN_LENGTH,
	COUPON_MAX_PERCENTAGE_DISCOUNT,
	COUPON_MIN_FIXED_DISCOUNT,
	isValidCouponCode,
	normalizeCouponCode,
} from './coupon';

const rankSchema = z
	.object({
		league: z.string().trim().min(1),
		division: z.string().trim().min(1),
	})
	.refine((rank) => findOrderRankIndex(rank.league, rank.division) >= 0, {
		message: 'Unknown rank.',
	});

export const createCouponSchema = z
	.object({
		code: z
			.string()
			.transform(normalizeCouponCode)
			.refine(isValidCouponCode, {
				message: `Code must be ${COUPON_CODE_MIN_LENGTH}-${COUPON_CODE_MAX_LENGTH} uppercase letters or numbers.`,
			})
			.optional(),
		discountType: z.enum(['percentage', 'fixed']),
		discount: z.number().positive(),
		firstOrderOnly: z.boolean().default(false),
		allowedServiceTypes: z.array(z.enum(orderServiceTypes)).default([]),
		allowedQueues: z.array(z.string().trim().min(1)).default([]),
		allowedEmails: z.array(z.string().trim().email().toLowerCase()).default([]),
		minSubtotal: z.number().int().positive().optional(),
		maxSubtotal: z.number().int().positive().optional(),
		minRank: rankSchema.optional(),
		maxRank: rankSchema.optional(),
		minExtrasCount: z.number().int().positive().optional(),
		requiredExtra: z.enum(orderExtraTypes).optional(),
		globalUsageLimit: z.number().int().positive().optional(),
		perUserUsageLimit: z.number().int().positive().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.discountType === 'percentage') {
			if (
				!Number.isInteger(value.discount) ||
				value.discount < 1 ||
				value.discount > COUPON_MAX_PERCENTAGE_DISCOUNT
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['discount'],
					message: `Percentage discount must be an integer between 1 and ${COUPON_MAX_PERCENTAGE_DISCOUNT}.`,
				});
			}
		} else if (value.discount < COUPON_MIN_FIXED_DISCOUNT) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['discount'],
				message: `Fixed discount must be at least R$${COUPON_MIN_FIXED_DISCOUNT.toFixed(2)}.`,
			});
		}

		if (
			value.minSubtotal !== undefined &&
			value.maxSubtotal !== undefined &&
			value.minSubtotal > value.maxSubtotal
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['maxSubtotal'],
				message: 'maxSubtotal must be greater than or equal to minSubtotal.',
			});
		}

		if (
			value.minRank &&
			value.maxRank &&
			findOrderRankIndex(value.minRank.league, value.minRank.division) >
				findOrderRankIndex(value.maxRank.league, value.maxRank.division)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['maxRank'],
				message: 'maxRank must be the same as or higher than minRank.',
			});
		}
	});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
