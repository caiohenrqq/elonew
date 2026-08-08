import { createOrderEvent } from '@modules/orders/application/order-event.factory';
import {
	ORDER_EVENT_PUBLISHER_KEY,
	type OrderEventPublisherPort,
} from '@modules/orders/application/ports/order-event-publisher.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import {
	OrderCredentialsPasswordMismatchError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import { Inject, Injectable, Optional } from '@nestjs/common';

type SaveOrderCredentialsInput = {
	orderId: string;
	clientId: string;
	login: string;
	summonerName: string;
	password: string;
	confirmPassword: string;
};

@Injectable()
export class SaveOrderCredentialsUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Optional()
		@Inject(ORDER_EVENT_PUBLISHER_KEY)
		private readonly orderEventPublisher?: OrderEventPublisherPort,
	) {}

	async execute(input: SaveOrderCredentialsInput): Promise<void> {
		const order = await this.orderRepository.findByIdForClient(
			input.orderId,
			input.clientId,
		);
		if (!order) throw new OrderNotFoundError();
		if (input.password !== input.confirmPassword)
			throw new OrderCredentialsPasswordMismatchError();

		order.setCredentials({
			login: input.login,
			summonerName: input.summonerName,
			password: input.password,
		});
		await this.orderRepository.saveCredentials(order);
		await this.orderEventPublisher?.publish(
			createOrderEvent('order.credentials_saved', order),
		);
	}
}
