import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';

type MarkOrderAsPaidInput = {
	orderId: string;
};

@Injectable()
export class MarkOrderAsPaidUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: MarkOrderAsPaidInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();
		if (order.status !== OrderStatus.AWAITING_PAYMENT) return;

		order.confirmPayment();
		await this.orderRepository.save(order);
	}
}
