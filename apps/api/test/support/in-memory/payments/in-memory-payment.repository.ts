import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { Payment } from '@modules/payments/domain/payment.entity';
import { Inject, Injectable, Optional } from '@nestjs/common';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

	constructor(
		@Optional()
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository?: OrderRepositoryPort,
	) {}

	findById(id: string): Promise<Payment | null> {
		return Promise.resolve(this.payments.get(id) ?? null);
	}

	async findByIdForClient(
		id: string,
		clientId: string,
	): Promise<Payment | null> {
		const payment = await this.findById(id);
		if (!payment) return null;
		if (!this.orderRepository) return payment;

		const order = await this.orderRepository.findByIdForClient(
			payment.orderId,
			clientId,
		);
		if (!order) return null;

		return payment;
	}

	findByOrderId(orderId: string): Promise<Payment | null> {
		for (const payment of this.payments.values()) {
			if (payment.orderId === orderId) return Promise.resolve(payment);
		}

		return Promise.resolve(null);
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<Payment | null> {
		const payment = await this.findByOrderId(orderId);
		if (!payment) return null;
		if (!this.orderRepository) return payment;

		const order = await this.orderRepository.findByIdForClient(
			payment.orderId,
			clientId,
		);
		if (!order) return null;

		return payment;
	}

	findByGatewayId(gatewayId: string): Promise<Payment | null> {
		for (const payment of this.payments.values()) {
			if (payment.gatewayId === gatewayId) return Promise.resolve(payment);
		}

		return Promise.resolve(null);
	}

	save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, payment);
		return Promise.resolve();
	}
}
