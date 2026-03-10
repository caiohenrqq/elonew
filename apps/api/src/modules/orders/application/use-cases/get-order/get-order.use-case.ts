import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import type { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';

type GetOrderInput = {
	orderId: string;
};

type GetOrderOutput = {
	id: string;
	status: OrderStatus;
};

@Injectable()
export class GetOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: GetOrderInput): Promise<GetOrderOutput> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();

		return { id: order.id, status: order.status };
	}
}
