import {
	mapAsBadRequest,
	mapAsNotFound,
	mapDomainErrorToHttpException,
} from '@app/common/http/domain-error.mapper';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import {
	OrderAlreadyExistsError,
	OrderCancellationNotAllowedError,
	OrderCredentialsPasswordMismatchError,
	OrderCredentialsStorageNotAllowedError,
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

type SaveOrderCredentialsRequestBody = {
	login: string;
	summonerName: string;
	password: string;
	confirmPassword: string;
};

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly createOrderUseCase: CreateOrderUseCase,
		private readonly getOrderUseCase: GetOrderUseCase,
		private readonly markOrderAsPaidUseCase: MarkOrderAsPaidUseCase,
		private readonly acceptOrderUseCase: AcceptOrderUseCase,
		private readonly rejectOrderUseCase: RejectOrderUseCase,
		private readonly cancelOrderUseCase: CancelOrderUseCase,
		private readonly completeOrderUseCase: CompleteOrderUseCase,
		private readonly saveOrderCredentialsUseCase: SaveOrderCredentialsUseCase,
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

	@Post(':orderId/reject')
	@HttpCode(200)
	async reject(@Param('orderId') orderId: string): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.rejectOrderUseCase.execute({ orderId }),
		);
	}

	@Post(':orderId/cancel')
	@HttpCode(200)
	async cancel(@Param('orderId') orderId: string): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.cancelOrderUseCase.execute({ orderId }),
		);
	}

	@Post(':orderId/complete')
	@HttpCode(200)
	async complete(
		@Param('orderId') orderId: string,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.completeOrderUseCase.execute({ orderId }),
		);
	}

	@Post(':orderId/credentials')
	@HttpCode(200)
	async saveCredentials(
		@Param('orderId') orderId: string,
		@Body() body: SaveOrderCredentialsRequestBody,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.saveOrderCredentialsUseCase.execute({
				orderId,
				login: body.login,
				summonerName: body.summonerName,
				password: body.password,
				confirmPassword: body.confirmPassword,
			}),
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
		return mapDomainErrorToHttpException(error, [
			mapAsNotFound(OrderNotFoundError),
			mapAsBadRequest(
				OrderAlreadyExistsError,
				OrderInvalidTransitionError,
				OrderCancellationNotAllowedError,
				OrderCredentialsStorageNotAllowedError,
				OrderCredentialsPasswordMismatchError,
			),
		]) as BadRequestException | NotFoundException;
	}
}
