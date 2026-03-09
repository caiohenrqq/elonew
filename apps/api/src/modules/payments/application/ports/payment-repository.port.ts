import type { Payment } from '@modules/payments/domain/payment.entity';

export const PAYMENT_REPOSITORY_KEY = Symbol('PAYMENT_REPOSITORY_KEY');

export interface PaymentRepositoryPort {
	findById(id: string): Promise<Payment | null>;
	findByOrderId(orderId: string): Promise<Payment | null>;
	save(payment: Payment): Promise<void>;
}
