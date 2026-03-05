import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class OrderStatusFromOrdersRepositoryGateway implements OrderStatusPort {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async findByOrderId(orderId: string) {
		const order = await this.orderRepository.findById(orderId);
		if (!order) return null;

		return order.status;
	}
}
