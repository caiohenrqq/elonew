export const PaymentMethod = {
	CREDIT_CARD: 'credit_card',
	PIX: 'pix',
	BOLETO: 'boleto',
} as const;

export const paymentMethodValues = [
	PaymentMethod.CREDIT_CARD,
	PaymentMethod.PIX,
	PaymentMethod.BOLETO,
] as const;

export type PaymentMethod = (typeof paymentMethodValues)[number];
