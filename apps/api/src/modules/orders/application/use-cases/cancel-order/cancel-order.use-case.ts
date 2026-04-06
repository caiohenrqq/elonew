import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { Inject, Injectable } from '@nestjs/common';

type CancelOrderInput = {
	orderId: string;
	clientId: string;
};

@Injectable()
export class CancelOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: CancelOrderInput): Promise<void> {
		const order = await this.orderRepository.findByIdForClient(
			input.orderId,
			input.clientId,
		);
		if (!order) throw new OrderNotFoundError();

		order.cancel();
		await this.orderRepository.save(order);
	}
}
