import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { Payment } from '@modules/payments/domain/payment.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
	}

	async findByOrderId(orderId: string): Promise<Payment | null> {
		for (const payment of this.payments.values()) {
			if (payment.orderId === orderId) return payment;
		}

		return null;
	}

	async save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, payment);
	}
}
