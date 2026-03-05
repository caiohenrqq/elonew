import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
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

	async execute(input: GetOrderInput): Promise<GetOrderOutput | null> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) {
			return null;
		}

		return { id: order.id, status: order.status };
	}
}
