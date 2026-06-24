export {
	type CreatePaymentSchemaInput,
	createPaymentSchema,
} from '@packages/shared/payments/create-payment.schema';

import { paymentMethodValues } from '@packages/shared/payments/payment-method';
import { z } from 'zod';
import { devPaymentOutcomeValues } from '../application/use-cases/simulate-dev-payment-outcome/simulate-dev-payment-outcome.use-case';

export const startCheckoutSchema = z.object({
	quoteId: z.string().trim().min(1),
	paymentMethod: z.enum(paymentMethodValues),
});

export type StartCheckoutSchemaInput = z.infer<typeof startCheckoutSchema>;

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

export const orderIdParamSchema = z.string().trim().min(1);

export type OrderIdParamSchemaInput = z.infer<typeof orderIdParamSchema>;

export const simulateDevPaymentOutcomeSchema = z.object({
	outcome: z.enum(devPaymentOutcomeValues),
});

export type SimulateDevPaymentOutcomeSchemaInput = z.infer<
	typeof simulateDevPaymentOutcomeSchema
>;
