import {
	BOOSTER_USER_READER_KEY,
	type BoosterUserReaderPort,
} from '@modules/orders/application/ports/booster-user-reader.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import {
	OrderBoosterNotEligibleError,
	OrderBoosterNotFoundError,
} from '@modules/orders/domain/order.errors';
import type { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import type { OrderServiceType } from '@shared/orders/service-type';

type CreateOrderInput = {
	clientId: string;
	boosterId?: string;
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
		@Inject(BOOSTER_USER_READER_KEY)
		private readonly boosterUserReader: BoosterUserReaderPort,
	) {}

	async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
		if (input.boosterId) {
			const booster = await this.boosterUserReader.findById(input.boosterId);
			if (!booster) throw new OrderBoosterNotFoundError();
			if (booster.role !== Role.BOOSTER)
				throw new OrderBoosterNotEligibleError();
		}

		const order = Order.createDraft({
			clientId: input.clientId,
			boosterId: input.boosterId,
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
