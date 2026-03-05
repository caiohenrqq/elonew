import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order.use-case';
import { ConfirmPaymentUseCase } from '@modules/orders/application/use-cases/confirm-payment.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order.use-case';
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
		private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
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
			this.confirmPaymentUseCase.execute({ orderId }),
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
		if (!(error instanceof Error)) {
			return new BadRequestException('Unexpected error.');
		}

		if (error.message === 'Order not found.') {
			return new NotFoundException(error.message);
		}

		return new BadRequestException(error.message);
	}
}
