import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import {
	OrderAlreadyExistsError,
	OrderCancellationNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Post,
} from '@nestjs/common';

type CreateOrderRequestBody = {
	orderId: string;
};

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly createOrderUseCase: CreateOrderUseCase,
		private readonly getOrderUseCase: GetOrderUseCase,
		private readonly markOrderAsPaidUseCase: MarkOrderAsPaidUseCase,
		private readonly acceptOrderUseCase: AcceptOrderUseCase,
		private readonly cancelOrderUseCase: CancelOrderUseCase,
	) {}

	@Post()
	async create(
		@Body() body: CreateOrderRequestBody,
	): Promise<{ id: string; status: string }> {
		try {
			return await this.createOrderUseCase.execute({ orderId: body.orderId });
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	@Get(':orderId')
	async get(
		@Param('orderId') orderId: string,
	): Promise<{ id: string; status: string }> {
		const order = await this.getOrderUseCase.execute({ orderId });
		if (!order) throw new NotFoundException('Order not found.');

		return order;
	}

	@Post(':orderId/payment-confirmed')
	@HttpCode(200)
	async confirmPayment(
		@Param('orderId') orderId: string,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.markOrderAsPaidUseCase.execute({ orderId }),
		);
	}

	@Post(':orderId/accept')
	@HttpCode(200)
	async accept(@Param('orderId') orderId: string): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.acceptOrderUseCase.execute({ orderId }),
		);
	}

	@Post(':orderId/cancel')
	@HttpCode(200)
	async cancel(@Param('orderId') orderId: string): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.cancelOrderUseCase.execute({ orderId }),
		);
	}

	private async executeMutation(
		mutation: () => Promise<void>,
	): Promise<{ success: true }> {
		try {
			await mutation();
			return { success: true };
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	private mapDomainError(
		error: unknown,
	): BadRequestException | NotFoundException {
		if (error instanceof OrderNotFoundError) {
			return new NotFoundException(error.message);
		}

		if (
			error instanceof OrderAlreadyExistsError ||
			error instanceof OrderInvalidTransitionError ||
			error instanceof OrderCancellationNotAllowedError
		) {
			return new BadRequestException(error.message);
		}

		return new BadRequestException('Unexpected error.');
	}
}
