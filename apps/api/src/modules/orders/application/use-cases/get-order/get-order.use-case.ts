import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import type { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';

type GetOrderInput = {
	orderId: string;
	clientId: string;
};

type GetOrderOutput = {
	id: string;
	status: OrderStatus;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
};

@Injectable()
export class GetOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: GetOrderInput): Promise<GetOrderOutput> {
		const order = await this.orderRepository.findByIdForClient(
			input.orderId,
			input.clientId,
		);
		if (!order) throw new OrderNotFoundError();

		return {
			id: order.id,
			status: order.status,
			subtotal: order.subtotal,
			totalAmount: order.totalAmount,
			discountAmount: order.discountAmount,
		};
	}
}
