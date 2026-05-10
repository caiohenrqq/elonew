import {
	CHAT_THREAD_WRITER_KEY,
	type ChatThreadWriterPort,
} from '@modules/chat/application/ports/chat-thread-writer.port';
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

type AcceptOrderInput = {
	orderId: string;
	boosterId: string;
};

@Injectable()
export class AcceptOrderUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Optional()
		@Inject(ORDER_EVENT_PUBLISHER_KEY)
		private readonly orderEventPublisher?: OrderEventPublisherPort,
		@Optional()
		@Inject(CHAT_THREAD_WRITER_KEY)
		private readonly chatThreadWriter?: ChatThreadWriterPort,
	) {}

	async execute(input: AcceptOrderInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();

		if (order.boosterId && order.boosterId !== input.boosterId)
			throw new OrderNotFoundError();

		if (!order.boosterId) order.assignBooster(input.boosterId);
		order.acceptByBooster();
		await this.orderRepository.save(order);
		await this.chatThreadWriter?.createOrderChat(order.id);
		await this.orderEventPublisher?.publish(
			createOrderEvent('order.accepted', order),
		);
	}
}
