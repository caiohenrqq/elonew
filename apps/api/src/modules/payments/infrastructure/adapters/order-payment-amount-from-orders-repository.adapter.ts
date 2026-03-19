import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import type { OrderPaymentAmountPort } from '@modules/payments/application/ports/order-payment-amount.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class OrderPaymentAmountFromOrdersRepositoryAdapter
	implements OrderPaymentAmountPort
{
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<number | null> {
		const order = await this.orderRepository.findByIdForClient(
			orderId,
			clientId,
		);
		if (!order || order.totalAmount === null) return null;

		return order.totalAmount;
	}
}
