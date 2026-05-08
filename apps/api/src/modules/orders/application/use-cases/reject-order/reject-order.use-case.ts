import { createOrderEvent } from '@modules/orders/application/order-event.factory';
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

type RejectOrderInput = {
	orderId: string;
	boosterId: string;
};

@Injectable()
export class RejectOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Optional()
		@Inject(ORDER_EVENT_PUBLISHER_KEY)
		private readonly orderEventPublisher?: OrderEventPublisherPort,
	) {}

	async execute(input: RejectOrderInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();
		if (order.boosterId && order.boosterId !== input.boosterId)
			throw new OrderNotFoundError();

		order.rejectByBooster();
		if (order.boosterId === input.boosterId) order.clearBoosterAssignment();
		if (!this.orderRepository.saveBoosterRejection) {
			await this.orderRepository.save(order);
			await this.orderEventPublisher?.publish(
				createOrderEvent('order.rejected', order, {
					boosterId: input.boosterId,
				}),
			);
			return;
		}
		await this.orderRepository.saveBoosterRejection(order, input.boosterId);
		await this.orderEventPublisher?.publish(
			createOrderEvent('order.rejected', order, {
				boosterId: input.boosterId,
			}),
		);
	}
}
