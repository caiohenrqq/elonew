import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderAlreadyExistsError } from '@modules/orders/domain/order.errors';
import type { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';

type CreateOrderInput = {
	orderId: string;
	boosterId?: string;
};

type CreateOrderOutput = {
	id: string;
	status: OrderStatus;
};

@Injectable()
export class CreateOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
		const existingOrder = await this.orderRepository.findById(input.orderId);
		if (existingOrder) throw new OrderAlreadyExistsError();

		const order = Order.create(input.orderId, {
			boosterId: input.boosterId,
		});
		await this.orderRepository.save(order);

		return { id: order.id, status: order.status };
	}
}
