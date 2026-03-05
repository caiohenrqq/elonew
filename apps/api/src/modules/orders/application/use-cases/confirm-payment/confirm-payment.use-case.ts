import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { Inject, Injectable } from '@nestjs/common';

type ConfirmPaymentInput = {
	orderId: string;
};

@Injectable()
export class ConfirmPaymentUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
	) {}

	async execute(input: ConfirmPaymentInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();

		order.confirmPayment();
		await this.orderRepository.save(order);
	}
}
