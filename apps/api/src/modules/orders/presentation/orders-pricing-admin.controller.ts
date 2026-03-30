import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { ActivateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/activate-order-pricing-version/activate-order-pricing-version.use-case';
import { CreateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/create-order-pricing-version/create-order-pricing-version.use-case';
import { GetOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/get-order-pricing-version/get-order-pricing-version.use-case';
import { ListOrderPricingVersionsUseCase } from '@modules/orders/application/use-cases/list-order-pricing-versions/list-order-pricing-versions.use-case';
import { UpdateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/update-order-pricing-version/update-order-pricing-version.use-case';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type OrderPricingVersionIdParamSchemaInput,
	orderPricingVersionIdParamSchema,
	type UpsertOrderPricingVersionSchemaInput,
	upsertOrderPricingVersionSchema,
} from './orders-pricing-admin.request-schemas';

@Controller('admin/order-pricing/versions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class OrdersPricingAdminController {
	constructor(
		private readonly createPricingVersionUseCase: CreateOrderPricingVersionUseCase,
		private readonly listPricingVersionsUseCase: ListOrderPricingVersionsUseCase,
		private readonly getPricingVersionUseCase: GetOrderPricingVersionUseCase,
		private readonly updatePricingVersionUseCase: UpdateOrderPricingVersionUseCase,
		private readonly activatePricingVersionUseCase: ActivateOrderPricingVersionUseCase,
	) {}

	@Post()
	async create(
		@Body(new ZodValidationPipe(upsertOrderPricingVersionSchema))
		body: UpsertOrderPricingVersionSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.createPricingVersionUseCase.execute(body);
	}

	@Get()
	async list(@CurrentUser() _currentUser: AuthenticatedUser) {
		return await this.listPricingVersionsUseCase.execute();
	}

	@Get(':versionId')
	async get(
		@Param('versionId', new ZodValidationPipe(orderPricingVersionIdParamSchema))
		versionId: OrderPricingVersionIdParamSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.getPricingVersionUseCase.execute({ versionId });
	}

	@Put(':versionId')
	async update(
		@Param('versionId', new ZodValidationPipe(orderPricingVersionIdParamSchema))
		versionId: OrderPricingVersionIdParamSchemaInput,
		@Body(new ZodValidationPipe(upsertOrderPricingVersionSchema))
		body: UpsertOrderPricingVersionSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.updatePricingVersionUseCase.execute({
			versionId,
			...body,
		});
	}

	@Post(':versionId/activate')
	@HttpCode(200)
	async activate(
		@Param('versionId', new ZodValidationPipe(orderPricingVersionIdParamSchema))
		versionId: OrderPricingVersionIdParamSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.activatePricingVersionUseCase.execute({
			versionId,
			now: new Date(),
		});
	}
}
