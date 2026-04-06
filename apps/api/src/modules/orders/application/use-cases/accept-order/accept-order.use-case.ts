import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { Inject, Injectable } from '@nestjs/common';

type AcceptOrderInput = {
	orderId: string;
	boosterId: string;
};

@Injectable()
export class AcceptOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: AcceptOrderInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();

		if (order.boosterId && order.boosterId !== input.boosterId)
			throw new OrderNotFoundError();

		if (!order.boosterId) order.assignBooster(input.boosterId);
		order.acceptByBooster();
		await this.orderRepository.save(order);
	}
}
