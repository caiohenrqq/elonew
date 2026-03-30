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
import { CreateOrderQuoteUseCase } from '@modules/orders/application/use-cases/create-order-quote/create-order-quote.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type CreateOrderSchemaInput,
	createOrderSchema,
} from '@shared/orders/create-order.schema';
import {
	type CreateOrderQuoteSchemaInput,
	createOrderQuoteSchema,
} from '@shared/orders/create-order-quote.schema';
import {
	type AcceptOrderSchemaInput,
	acceptOrderSchema,
	type SaveOrderCredentialsSchemaInput,
	saveOrderCredentialsSchema,
} from './orders.request-schemas';

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly createOrderUseCase: CreateOrderUseCase,
		private readonly createOrderQuoteUseCase: CreateOrderQuoteUseCase,
		private readonly getOrderUseCase: GetOrderUseCase,
		private readonly markOrderAsPaidUseCase: MarkOrderAsPaidUseCase,
		private readonly acceptOrderUseCase: AcceptOrderUseCase,
		private readonly rejectOrderUseCase: RejectOrderUseCase,
		private readonly cancelOrderUseCase: CancelOrderUseCase,
		private readonly completeOrderUseCase: CompleteOrderUseCase,
		private readonly saveOrderCredentialsUseCase: SaveOrderCredentialsUseCase,
	) {}

	@Post('quote')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async quote(
		@Body(new ZodValidationPipe(createOrderQuoteSchema))
		body: CreateOrderQuoteSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		quoteId: string;
		subtotal: number;
		totalAmount: number;
		discountAmount: number;
	}> {
		return await this.createOrderQuoteUseCase.execute({
			clientId: currentUser.id,
			couponCode: body.couponCode,
			extras: body.extras,
			now: new Date(),
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
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async create(
		@Body(new ZodValidationPipe(createOrderSchema))
		body: CreateOrderSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		id: string;
		status: string;
		subtotal: number | null;
		totalAmount: number | null;
		discountAmount: number;
	}> {
		return await this.createOrderUseCase.execute({
			clientId: currentUser.id,
			boosterId: body.boosterId,
			quoteId: body.quoteId,
			now: new Date(),
		});
	}

	@Get(':orderId')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async get(
		@Param('orderId') orderId: string,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		id: string;
		status: string;
		subtotal: number | null;
		totalAmount: number | null;
		discountAmount: number;
	}> {
		return await this.getOrderUseCase.execute({
			orderId,
			clientId: currentUser.id,
		});
	}

	@Post(':orderId/payment-confirmed')
	@HttpCode(200)
	async confirmPayment(
		@Param('orderId') orderId: string,
	): Promise<{ success: true }> {
		await this.markOrderAsPaidUseCase.execute({ orderId });
		return { success: true };
	}

	@Post(':orderId/accept')
	@HttpCode(200)
	async accept(
		@Param('orderId') orderId: string,
		@Body(new ZodValidationPipe(acceptOrderSchema))
		body?: AcceptOrderSchemaInput,
	): Promise<{ success: true }> {
		await this.acceptOrderUseCase.execute({
			orderId,
			boosterId: body?.boosterId,
		});
		return { success: true };
	}

	@Post(':orderId/reject')
	@HttpCode(200)
	async reject(@Param('orderId') orderId: string): Promise<{ success: true }> {
		await this.rejectOrderUseCase.execute({ orderId });
		return { success: true };
	}

	@Post(':orderId/cancel')
	@HttpCode(200)
	async cancel(@Param('orderId') orderId: string): Promise<{ success: true }> {
		await this.cancelOrderUseCase.execute({ orderId });
		return { success: true };
	}

	@Post(':orderId/complete')
	@HttpCode(200)
	async complete(
		@Param('orderId') orderId: string,
	): Promise<{ success: true }> {
		await this.completeOrderUseCase.execute({ orderId });
		return { success: true };
	}

	@Post(':orderId/credentials')
	@HttpCode(200)
	async saveCredentials(
		@Param('orderId') orderId: string,
		@Body(new ZodValidationPipe(saveOrderCredentialsSchema))
		body: SaveOrderCredentialsSchemaInput,
	): Promise<{ success: true }> {
		await this.saveOrderCredentialsUseCase.execute({
			orderId,
			login: body.login,
			summonerName: body.summonerName,
			password: body.password,
			confirmPassword: body.confirmPassword,
		});
		return { success: true };
	}
}
