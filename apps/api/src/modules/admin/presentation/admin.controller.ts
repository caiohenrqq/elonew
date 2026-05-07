import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { BlockAdminUserUseCase } from '@modules/admin/application/use-cases/block-admin-user/block-admin-user.use-case';
import { ForceCancelAdminOrderUseCase } from '@modules/admin/application/use-cases/force-cancel-admin-order/force-cancel-admin-order.use-case';
import { GetAdminDashboardUseCase } from '@modules/admin/application/use-cases/get-admin-dashboard/get-admin-dashboard.use-case';
import { UnblockAdminUserUseCase } from '@modules/admin/application/use-cases/unblock-admin-user/unblock-admin-user.use-case';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
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
	type AdminIdParamSchemaInput,
	type AdminListQuerySchemaInput,
	type AdminReasonSchemaInput,
	adminIdParamSchema,
	adminListQuerySchema,
	adminReasonSchema,
} from './admin.request-schemas';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
	constructor(
		private readonly dashboard: GetAdminDashboardUseCase,
		private readonly blockUser: BlockAdminUserUseCase,
		private readonly unblockUser: UnblockAdminUserUseCase,
		private readonly forceCancelOrder: ForceCancelAdminOrderUseCase,
	) {}

	@Get('metrics')
	async getMetrics(@CurrentUser() _currentUser: AuthenticatedUser) {
		return await this.dashboard.getMetrics();
	}

	@Get('users')
	async listUsers(
		@Query(new ZodValidationPipe(adminListQuerySchema))
		query: AdminListQuerySchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.dashboard.listUsers(query);
	}

	@Post('users/:userId/block')
	@HttpCode(200)
	async block(
		@Param('userId', new ZodValidationPipe(adminIdParamSchema))
		userId: AdminIdParamSchemaInput,
		@Body(new ZodValidationPipe(adminReasonSchema))
		body: AdminReasonSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		await this.blockUser.execute({
			adminUserId: currentUser.id,
			targetUserId: userId,
			reason: body.reason,
			now: new Date(),
		});

		return { ok: true };
	}

	@Post('users/:userId/unblock')
	@HttpCode(200)
	async unblock(
		@Param('userId', new ZodValidationPipe(adminIdParamSchema))
		userId: AdminIdParamSchemaInput,
		@Body(new ZodValidationPipe(adminReasonSchema))
		body: AdminReasonSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		await this.unblockUser.execute({
			adminUserId: currentUser.id,
			targetUserId: userId,
			reason: body.reason,
			now: new Date(),
		});

		return { ok: true };
	}

	@Get('orders')
	async listOrders(
		@Query(new ZodValidationPipe(adminListQuerySchema))
		query: AdminListQuerySchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.dashboard.listOrders({ limit: query.limit });
	}

	@Post('orders/:orderId/force-cancel')
	@HttpCode(200)
	async forceCancel(
		@Param('orderId', new ZodValidationPipe(adminIdParamSchema))
		orderId: AdminIdParamSchemaInput,
		@Body(new ZodValidationPipe(adminReasonSchema))
		body: AdminReasonSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		await this.forceCancelOrder.execute({
			adminUserId: currentUser.id,
			orderId,
			reason: body.reason,
			now: new Date(),
		});

		return { ok: true };
	}

	@Get('support/tickets')
	async listSupportTickets(
		@Query(new ZodValidationPipe(adminListQuerySchema))
		query: AdminListQuerySchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.dashboard.listSupportTickets({ limit: query.limit });
	}
}
