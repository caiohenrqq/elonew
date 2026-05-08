import { z } from 'zod';
import {
	isMasterPdlDivision,
	MASTER_PDL_MAX,
	MASTER_PDL_MIN,
	MASTER_RANK_DIVISION,
} from '../model/rank-options';

const isMasterLeague = (league: string) =>
	league.trim().toLowerCase() === 'master';

const isValidMasterDivision = (division: string) => {
	return division === MASTER_RANK_DIVISION || isMasterPdlDivision(division);
};

const orderQuoteBaseSchema = z.object({
	serviceType: z.enum(['elo_boost', 'duo_boost']),
	couponCode: z.string().trim().min(1).optional(),
	extras: z.array(z.string()).default([]),
	currentLeague: z.string().trim().min(1),
	currentDivision: z.string().trim().min(1),
	currentLp: z.number().int().min(0).max(MASTER_PDL_MAX),
	desiredLeague: z.string().trim().min(1),
	desiredDivision: z.string().trim().min(1),
	server: z.string().trim().min(1),
	desiredQueue: z.string().trim().min(1),
	lpGain: z.number().int().positive(),
	deadline: z.string().datetime(),
});

const validateOrderQuoteInput = (
	input: z.infer<typeof orderQuoteBaseSchema>,
	context: z.RefinementCtx,
) => {
	if (!isMasterLeague(input.currentLeague) && input.currentLp > 99) {
		context.addIssue({
			code: z.ZodIssueCode.too_big,
			type: 'number',
			maximum: 99,
			inclusive: true,
			path: ['currentLp'],
			message: 'Current LP must be between 0 and 99 before Master.',
		});
	}

	if (
		isMasterLeague(input.currentLeague) &&
		!isValidMasterDivision(input.currentDivision)
	) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['currentDivision'],
			message: `Master PDL must be between ${MASTER_PDL_MIN} and ${MASTER_PDL_MAX}.`,
		});
	}

	if (
		isMasterLeague(input.desiredLeague) &&
		!isValidMasterDivision(input.desiredDivision)
	) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['desiredDivision'],
			message: `Master PDL must be between ${MASTER_PDL_MIN} and ${MASTER_PDL_MAX}.`,
		});
	}
};

export const orderQuoteSchema = orderQuoteBaseSchema.superRefine(
	validateOrderQuoteInput,
);

export const createOrderSchema = z.object({
	quoteId: z.string().trim().min(1),
	boosterId: z.string().trim().min(1).optional(),
});

export const createPaymentSchema = z.object({
	orderId: z.string().trim().min(1),
	paymentMethod: z.enum(['credit_card', 'pix', 'boleto']),
});

export const resumePaymentCheckoutSchema = z.object({
	paymentId: z.string().trim().min(1),
	checkoutUrl: z.string().trim().url(),
});

export const startCheckoutSchema = orderQuoteBaseSchema
	.extend({
		paymentMethod: createPaymentSchema.shape.paymentMethod,
	})
	.superRefine(validateOrderQuoteInput);

export type OrderQuoteInput = z.infer<typeof orderQuoteSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ResumePaymentCheckoutOutput = z.infer<
	typeof resumePaymentCheckoutSchema
>;
export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;

export type OrderQuoteOutput = {
	quoteId: string;
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
};

export type OrderQuotePreviewOutput = {
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
	extras: {
		type: string;
		price: number;
	}[];
};

export type CreateOrderOutput = {
	id: string;
	status: string;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
};

export type CreatePaymentOutput = {
	id: string;
	orderId: string;
	status: string;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: string;
	checkoutUrl: string;
};

export type GetOrderOutput = {
	id: string;
	status: string;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
};

export const clientDashboardOrderSchema = z.object({
	id: z.string(),
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
	subtotal: z.number().nullable(),
	totalAmount: z.number().nullable(),
	discountAmount: z.number(),
	createdAt: z.string(),
});

export const clientDashboardOrdersSchema = z.object({
	orders: z.array(clientDashboardOrderSchema),
	summary: z.object({
		activeOrders: z.number().int().nonnegative(),
		totalOrders: z.number().int().nonnegative(),
		totalInvested: z.number().nonnegative(),
	}),
});

export type ClientDashboardOrderOutput = z.infer<
	typeof clientDashboardOrderSchema
>;
export type ClientDashboardOrdersOutput = z.infer<
	typeof clientDashboardOrdersSchema
>;
