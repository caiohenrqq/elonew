import { paymentMethodValues } from '@shared/payments/payment-method';
import { z } from 'zod';

export const createPaymentSchema = z.object({
	paymentId: z.string().trim().min(1),
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
