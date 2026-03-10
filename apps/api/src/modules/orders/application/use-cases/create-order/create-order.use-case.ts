import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import type { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';
import type { OrderServiceType } from '@shared/orders/service-type';

type CreateOrderInput = {
	clientId: string;
	serviceType: OrderServiceType;
	currentLeague: string;
	currentDivision: string;
	currentLp: number;
	desiredLeague: string;
	desiredDivision: string;
	server: string;
	desiredQueue: string;
	lpGain: number;
	deadline: Date;
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
		const order = Order.createDraft({
			clientId: input.clientId,
			requestDetails: {
				serviceType: input.serviceType,
				currentLeague: input.currentLeague,
				currentDivision: input.currentDivision,
				currentLp: input.currentLp,
				desiredLeague: input.desiredLeague,
				desiredDivision: input.desiredDivision,
				server: input.server,
				desiredQueue: input.desiredQueue,
				lpGain: input.lpGain,
				deadline: input.deadline,
			},
		});
		const createdOrder = await this.orderRepository.create(order);

		return { id: createdOrder.id, status: createdOrder.status };
	}
}
