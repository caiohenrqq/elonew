import { randomUUID } from 'node:crypto';
import {
	BOOSTER_USER_READER_KEY,
	type BoosterUserReaderPort,
} from '@modules/orders/application/ports/booster-user-reader.port';
import {
	ORDER_CHECKOUT_PORT_KEY,
	type OrderCheckoutPort,
} from '@modules/orders/application/ports/order-checkout.port';
import {
	OrderBoosterNotEligibleError,
	OrderBoosterNotFoundError,
} from '@modules/orders/domain/order.errors';
import type { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type CreateOrderInput = {
	clientId: string;
	boosterId?: string;
	quoteId: string;
	now: Date;
};

type CreateOrderOutput = {
	id: string;
	status: OrderStatus;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
};

@Injectable()
export class CreateOrderUseCase {
	constructor(
		@Inject(BOOSTER_USER_READER_KEY)
		private readonly boosterUserReader: BoosterUserReaderPort,
		@Inject(ORDER_CHECKOUT_PORT_KEY)
		private readonly orderCheckout: OrderCheckoutPort,
	) {}

	async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
		if (input.boosterId) {
			const booster = await this.boosterUserReader.findById(input.boosterId);
			if (!booster) throw new OrderBoosterNotFoundError();
			if (booster.role !== Role.BOOSTER)
				throw new OrderBoosterNotEligibleError();
		}

		const createdOrder =
			await this.orderCheckout.createDraftOrderFromOwnedQuote({
				orderId: randomUUID(),
				clientId: input.clientId,
				boosterId: input.boosterId,
				quoteId: input.quoteId,
				now: input.now,
			});

		return {
			id: createdOrder.id,
			status: createdOrder.status,
			subtotal: createdOrder.subtotal,
			totalAmount: createdOrder.totalAmount,
			discountAmount: createdOrder.discountAmount,
		};
	}
}
