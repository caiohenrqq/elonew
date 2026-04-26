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
import { ListClientOrdersUseCase } from '@modules/orders/application/use-cases/list-client-orders/list-client-orders.use-case';
import { PreviewOrderQuoteUseCase } from '@modules/orders/application/use-cases/preview-order-quote/preview-order-quote.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type CreateOrderSchemaInput,
	createOrderSchema,
} from '@packages/shared/orders/create-order.schema';
import {
	type CreateOrderQuoteSchemaInput,
	createOrderQuoteSchema,
} from '@packages/shared/orders/create-order-quote.schema';
import {
	type ListClientOrdersQuerySchemaInput,
	listClientOrdersQuerySchema,
	type OrderIdParamSchemaInput,
	orderIdParamSchema,
	type SaveOrderCredentialsSchemaInput,
	saveOrderCredentialsSchema,
} from './orders.request-schemas';

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly createOrderUseCase: CreateOrderUseCase,
		private readonly createOrderQuoteUseCase: CreateOrderQuoteUseCase,
		private readonly previewOrderQuoteUseCase: PreviewOrderQuoteUseCase,
		private readonly getOrderUseCase: GetOrderUseCase,
		private readonly listClientOrdersUseCase: ListClientOrdersUseCase,
		private readonly acceptOrderUseCase: AcceptOrderUseCase,
		private readonly rejectOrderUseCase: RejectOrderUseCase,
		private readonly cancelOrderUseCase: CancelOrderUseCase,
		private readonly completeOrderUseCase: CompleteOrderUseCase,
		private readonly saveOrderCredentialsUseCase: SaveOrderCredentialsUseCase,
	) {}

	@Post('quote/preview')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async previewQuote(
		@Body(new ZodValidationPipe(createOrderQuoteSchema))
		body: CreateOrderQuoteSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		subtotal: number;
		totalAmount: number;
		discountAmount: number;
		extras: {
			type: string;
			price: number;
		}[];
	}> {
		return await this.previewOrderQuoteUseCase.execute({
			clientId: currentUser.id,
			couponCode: body.couponCode,
			extras: body.extras,
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

	@Get()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async list(
		@Query(new ZodValidationPipe(listClientOrdersQuerySchema))
		query: ListClientOrdersQuerySchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		orders: Array<{
			id: string;
			status: string;
			serviceType: string | null;
			currentLeague: string | null;
			currentDivision: string | null;
			currentLp: number | null;
			desiredLeague: string | null;
			desiredDivision: string | null;
			server: string | null;
			desiredQueue: string | null;
			lpGain: number | null;
			deadline: Date | null;
			subtotal: number | null;
			totalAmount: number | null;
			discountAmount: number;
			createdAt: Date;
		}>;
		summary: {
			activeOrders: number;
			totalOrders: number;
			totalInvested: number;
		};
	}> {
		const result = await this.listClientOrdersUseCase.execute({
			clientId: currentUser.id,
			limit: query.limit,
		});

		return {
			orders: result.orders.map(({ clientId: _clientId, ...order }) => order),
			summary: result.summary,
		};
	}

	@Get(':orderId')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async get(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
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

	@Post(':orderId/accept')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.BOOSTER)
	@HttpCode(200)
	async accept(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ success: true }> {
		await this.acceptOrderUseCase.execute({
			orderId,
			boosterId: currentUser.id,
		});
		return { success: true };
	}

	@Post(':orderId/reject')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.BOOSTER)
	@HttpCode(200)
	async reject(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ success: true }> {
		await this.rejectOrderUseCase.execute({
			orderId,
			boosterId: currentUser.id,
		});
		return { success: true };
	}

	@Post(':orderId/cancel')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	@HttpCode(200)
	async cancel(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ success: true }> {
		await this.cancelOrderUseCase.execute({
			orderId,
			clientId: currentUser.id,
		});
		return { success: true };
	}

	@Post(':orderId/complete')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.BOOSTER)
	@HttpCode(200)
	async complete(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ success: true }> {
		await this.completeOrderUseCase.execute({
			orderId,
			boosterId: currentUser.id,
		});
		return { success: true };
	}

	@Post(':orderId/credentials')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	@HttpCode(200)
	async saveCredentials(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@Body(new ZodValidationPipe(saveOrderCredentialsSchema))
		body: SaveOrderCredentialsSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ success: true }> {
		await this.saveOrderCredentialsUseCase.execute({
			orderId,
			clientId: currentUser.id,
			login: body.login,
			summonerName: body.summonerName,
			password: body.password,
			confirmPassword: body.confirmPassword,
		});
		return { success: true };
	}
}
