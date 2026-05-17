import { z } from 'zod';
import { paymentMethodValues } from './payment-method';

export const createPaymentSchema = z.object({
	orderId: z.string().trim().min(1),
	paymentMethod: z.enum(paymentMethodValues),
});

export type CreatePaymentSchemaInput = z.infer<typeof createPaymentSchema>;
