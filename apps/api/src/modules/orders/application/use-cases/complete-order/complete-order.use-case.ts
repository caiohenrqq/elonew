import { createOrderEvent } from '@modules/orders/application/order-event.factory';
import {
	ORDER_COMPLETION_EARNINGS_PORT_KEY,
	type OrderCompletionEarningsPort,
} from '@modules/orders/application/ports/order-completion-earnings.port';
import {
	ORDER_EVENT_PUBLISHER_KEY,
	type OrderEventPublisherPort,
} from '@modules/orders/application/ports/order-event-publisher.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { Inject, Injectable, Optional } from '@nestjs/common';

type CompleteOrderInput = {
	orderId: string;
	boosterId: string;
};

@Injectable()
export class CompleteOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Inject(ORDER_COMPLETION_EARNINGS_PORT_KEY)
		private readonly orderCompletionEarningsPort: OrderCompletionEarningsPort,
		@Optional()
		@Inject(ORDER_EVENT_PUBLISHER_KEY)
		private readonly orderEventPublisher?: OrderEventPublisherPort,
	) {}

	async execute(input: CompleteOrderInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();
		if (order.boosterId !== input.boosterId) throw new OrderNotFoundError();

		order.complete();
		await this.orderRepository.save(order);
		await this.orderEventPublisher?.publish(
			createOrderEvent('order.completed', order, {
				boosterId: input.boosterId,
			}),
		);
		if (!order.boosterId) return;

		await this.orderCompletionEarningsPort.creditCompletedOrderEarnings({
			orderId: order.id,
			boosterId: order.boosterId,
			completedAt: new Date(),
		});
	}
}
