import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import {
	OrderCredentialsPasswordMismatchError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import { Inject, Injectable } from '@nestjs/common';

type SaveOrderCredentialsInput = {
	orderId: string;
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
	) {}

	async execute(input: SaveOrderCredentialsInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();
		if (input.password !== input.confirmPassword)
			throw new OrderCredentialsPasswordMismatchError();

		order.setCredentials({
			login: input.login,
			summonerName: input.summonerName,
			password: input.password,
		});
		await this.orderRepository.save(order);
	}
}
