import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { Inject, Injectable } from '@nestjs/common';

type CancelOrderInput = {
	orderId: string;
};

@Injectable()
export class CancelOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: CancelOrderInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new Error('Order not found.');

		order.cancel();
		await this.orderRepository.save(order);
	}
}
