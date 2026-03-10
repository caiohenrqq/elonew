import {
	mapAsBadRequest,
	mapAsNotFound,
	mapDomainErrorToHttpException,
} from '@app/common/http/domain-error.mapper';
import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
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
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type CreateOrderSchemaInput,
	createOrderSchema,
} from '@shared/orders/create-order.schema';

type AcceptOrderRequestBody = {
	boosterId?: string;
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
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async create(
		@Body(new ZodValidationPipe(createOrderSchema))
		body: CreateOrderSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ id: string; status: string }> {
		try {
			return await this.createOrderUseCase.execute({
				clientId: currentUser.id,
				serviceType: body.serviceType,
				currentLeague: body.currentLeague,
				currentDivision: body.currentDivision,
				currentLp: body.currentLp,
				desiredLeague: body.desiredLeague,
				desiredDivision: body.desiredDivision,
				server: body.server,
				desiredQueue: body.desiredQueue,
				lpGain: body.lpGain,
				deadline: new Date(body.deadline),
			});
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	@Get(':orderId')
	async get(
		@Param('orderId') orderId: string,
	): Promise<{ id: string; status: string }> {
		try {
			return await this.getOrderUseCase.execute({ orderId });
		} catch (error) {
			throw this.mapDomainError(error);
		}
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
	async accept(
		@Param('orderId') orderId: string,
		@Body() body?: AcceptOrderRequestBody,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.acceptOrderUseCase.execute({
				orderId,
				boosterId: body?.boosterId,
			}),
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
