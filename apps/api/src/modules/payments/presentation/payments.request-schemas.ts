import { paymentMethodValues } from '@packages/shared/payments/payment-method';
import { z } from 'zod';

export const createPaymentSchema = z.object({
	orderId: z.string().trim().min(1),
	paymentMethod: z.enum(paymentMethodValues),
});

export type CreatePaymentSchemaInput = z.infer<typeof createPaymentSchema>;

export const mercadoPagoWebhookSchema = z.object({
	action: z.string().trim().min(1),
	data: z.object({
		id: z.string().trim().min(1),
	}),
	id: z.string().trim().min(1),
	type: z.string().trim().min(1),
});

export type MercadoPagoWebhookSchemaInput = z.infer<
	typeof mercadoPagoWebhookSchema
>;

export const paymentIdParamSchema = z.string().trim().min(1);

export type PaymentIdParamSchemaInput = z.infer<typeof paymentIdParamSchema>;
