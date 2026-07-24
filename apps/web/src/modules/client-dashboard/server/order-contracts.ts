import type { CreateOrderSchemaInput } from '@packages/shared/orders/create-order.schema';
import {
	type CreateOrderQuoteSchemaInput,
	createOrderQuoteSchema,
	previewOrderQuoteSchema,
} from '@packages/shared/orders/create-order-quote.schema';
import {
	type CreatePaymentSchemaInput,
	createPaymentSchema,
} from '@packages/shared/payments/create-payment.schema';
import { z } from 'zod';

export { createOrderSchema } from '@packages/shared/orders/create-order.schema';
export { createPaymentSchema } from '@packages/shared/payments/create-payment.schema';

export const orderQuoteSchema = createOrderQuoteSchema;

export const resumePaymentCheckoutSchema = z.object({
	paymentId: z.string().trim().min(1),
	checkoutUrl: z.string().trim().url(),
});

export const startCheckoutSchema = createOrderQuoteSchema.and(
	z.object({
		paymentMethod: createPaymentSchema.shape.paymentMethod,
	}),
);

// The price preview never persists a quote, so it omits the summoner name.
export const previewCheckoutSchema = previewOrderQuoteSchema.and(
	z.object({
		paymentMethod: createPaymentSchema.shape.paymentMethod,
	}),
);

export type PreviewCheckoutInput = z.infer<typeof previewCheckoutSchema>;

export const checkoutResultSchema = z.object({
	orderId: z.string().trim().min(1),
	paymentId: z.string().trim().min(1),
	checkoutUrl: z.string().trim().url(),
});

export type CheckoutResultOutput = z.infer<typeof checkoutResultSchema>;

export type OrderQuoteInput = CreateOrderQuoteSchemaInput;
export type CreateOrderInput = CreateOrderSchemaInput;
export type CreatePaymentInput = CreatePaymentSchemaInput;
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

export const saveOrderCredentialsSchema = z
	.object({
		login: z.string().trim().min(8).max(64),
		summonerName: z.string().trim().min(1).max(64),
		password: z.string().min(8).max(128),
		confirmPassword: z.string().min(8).max(128),
	})
	.refine((input) => input.password === input.confirmPassword, {
		message: 'As senhas não coincidem.',
		path: ['confirmPassword'],
	});

export type SaveOrderCredentialsInput = z.infer<
	typeof saveOrderCredentialsSchema
>;

export type GetOrderOutput = {
	id: string;
	status: string;
	hasCredentials: boolean;
	summonerName: string | null;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
	serviceType: string | null;
	currentLeague: string | null;
	currentDivision: string | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
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
