import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import type { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable, Optional } from '@nestjs/common';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();
	private readonly clientIds = new Map<string, string>();
	private readonly failOnSavePaymentIds = new Set<string>();

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
		const ownerId = this.clientIds.get(payment.id);
		if (ownerId !== undefined) return ownerId === clientId ? payment : null;
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
		const ownerId = this.clientIds.get(payment.id);
		if (ownerId !== undefined) return ownerId === clientId ? payment : null;
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

	async findStaleAwaitingCheckoutCandidates(): Promise<
		Array<{ payment: Payment }>
	> {
		const candidates: Array<{ payment: Payment }> = [];
		for (const payment of this.payments.values()) {
			if (payment.status !== PaymentStatus.AWAITING_CONFIRMATION) continue;
			if (this.orderRepository) {
				const order = await this.orderRepository.findById(payment.orderId);
				if (!order || order.status !== 'awaiting_payment') continue;
			}
			candidates.push({ payment });
		}

		return candidates;
	}

	async withStaleCheckoutReconciliationLock<T>(
		callback: () => Promise<T>,
	): Promise<T | null> {
		return await callback();
	}

	save(payment: Payment): Promise<void> {
		if (this.failOnSavePaymentIds.has(payment.id))
			return Promise.reject(new Error('Payment save failed.'));

		this.payments.set(payment.id, payment);
		return Promise.resolve();
	}

	insert(payment: Payment, clientId?: string): void {
		this.payments.set(payment.id, payment);
		if (clientId !== undefined) this.clientIds.set(payment.id, clientId);
	}

	setFailOnSave(paymentId: string): void {
		this.failOnSavePaymentIds.add(paymentId);
	}
}
