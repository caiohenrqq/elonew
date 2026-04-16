import { z } from 'zod';

export const orderQuoteSchema = z.object({
	serviceType: z.enum(['elo_boost', 'duo_boost']),
	couponCode: z.string().trim().min(1).optional(),
	extras: z.array(z.string()).default([]),
	currentLeague: z.string().trim().min(1),
	currentDivision: z.string().trim().min(1),
	currentLp: z.number().int().min(0).max(99),
	desiredLeague: z.string().trim().min(1),
	desiredDivision: z.string().trim().min(1),
	server: z.string().trim().min(1),
	desiredQueue: z.string().trim().min(1),
	lpGain: z.number().int().positive(),
	deadline: z.string().datetime(),
});

export const createOrderSchema = z.object({
	quoteId: z.string().trim().min(1),
	boosterId: z.string().trim().min(1).optional(),
});

export const createPaymentSchema = z.object({
	orderId: z.string().trim().min(1),
	paymentMethod: z.enum(['credit_card', 'pix', 'boleto']),
});

export const startCheckoutSchema = orderQuoteSchema.extend({
	paymentMethod: createPaymentSchema.shape.paymentMethod,
});

export type OrderQuoteInput = z.infer<typeof orderQuoteSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
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
