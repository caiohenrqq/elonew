import {
	CLIENT_ORDER_READER_KEY,
	type ClientOrderReaderPort,
} from '@modules/orders/application/ports/client-order-reader.port';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { Inject, Injectable } from '@nestjs/common';

type GetOrderInput = {
	orderId: string;
	clientId: string;
};

@Injectable()
export class GetOrderUseCase {
	constructor(
		@Inject(CLIENT_ORDER_READER_KEY)
		private readonly orderReader: ClientOrderReaderPort,
	) {}

	async execute(input: GetOrderInput) {
		const order = await this.orderReader.findDetailsForClient(
			input.orderId,
			input.clientId,
		);
		if (!order) throw new OrderNotFoundError();
		return order;
	}
}
