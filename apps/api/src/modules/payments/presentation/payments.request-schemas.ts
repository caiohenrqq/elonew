import { paymentMethodValues } from '@shared/payments/payment-method';
import { z } from 'zod';

export const createPaymentSchema = z.object({
	orderId: z.string().trim().min(1),
	paymentMethod: z.enum(paymentMethodValues),
});

export type CreatePaymentSchemaInput = z.infer<typeof createPaymentSchema>;

export const handlePaymentConfirmedWebhookSchema = z.object({
	eventId: z.string().trim().min(1),
	paymentId: z.string().trim().min(1),
});

export type HandlePaymentConfirmedWebhookSchemaInput = z.infer<
	typeof handlePaymentConfirmedWebhookSchema
>;

export const handlePaymentConfirmedWebhookQuerySchema = z.object({
	'data.id': z.string().trim().min(1),
});

export type HandlePaymentConfirmedWebhookQuerySchemaInput = z.infer<
	typeof handlePaymentConfirmedWebhookQuerySchema
>;

export const paymentIdParamSchema = z.string().trim().min(1);

export type PaymentIdParamSchemaInput = z.infer<typeof paymentIdParamSchema>;
