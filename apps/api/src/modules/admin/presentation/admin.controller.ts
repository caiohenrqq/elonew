import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { BlockAdminUserUseCase } from '@modules/admin/application/use-cases/block-admin-user/block-admin-user.use-case';
import { CreateAdminUserUseCase } from '@modules/admin/application/use-cases/create-admin-user/create-admin-user.use-case';
import { ForceCancelAdminOrderUseCase } from '@modules/admin/application/use-cases/force-cancel-admin-order/force-cancel-admin-order.use-case';
import { GetAdminDashboardUseCase } from '@modules/admin/application/use-cases/get-admin-dashboard/get-admin-dashboard.use-case';
import { ResendAdminUserPasswordSetupUseCase } from '@modules/admin/application/use-cases/resend-admin-user-password-setup/resend-admin-user-password-setup.use-case';
import { UnblockAdminUserUseCase } from '@modules/admin/application/use-cases/unblock-admin-user/unblock-admin-user.use-case';
import { UpdateAdminUserUseCase } from '@modules/admin/application/use-cases/update-admin-user/update-admin-user.use-case';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type AdminCreateUserSchemaInput,
	type AdminIdParamSchemaInput,
	type AdminListQuerySchemaInput,
	type AdminReasonSchemaInput,
	type AdminUpdateUserSchemaInput,
	adminCreateUserSchema,
	adminIdParamSchema,
	adminListQuerySchema,
	adminReasonSchema,
	adminUpdateUserSchema,
} from './admin.request-schemas';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
	constructor(
		private readonly dashboard: GetAdminDashboardUseCase,
		private readonly createUser: CreateAdminUserUseCase,
		private readonly resendPasswordSetup: ResendAdminUserPasswordSetupUseCase,
		private readonly blockUser: BlockAdminUserUseCase,
		private readonly unblockUser: UnblockAdminUserUseCase,
		private readonly updateUser: UpdateAdminUserUseCase,
		private readonly forceCancelOrder: ForceCancelAdminOrderUseCase,
	) {}

	@Patch('users/:userId')
	@HttpCode(200)
	async update(
		@Param('userId', new ZodValidationPipe(adminIdParamSchema)) userId: string,
		@Body(new ZodValidationPipe(adminUpdateUserSchema))
		body: AdminUpdateUserSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		await this.updateUser.execute({
			adminUserId: currentUser.id,
			targetUserId: userId,
			...('role' in body ? { role: body.role as Role } : body),
			now: new Date(),
		});
		return { ok: true };
	}

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

	@Post('users')
	async create(
		@Body(new ZodValidationPipe(adminCreateUserSchema))
		body: AdminCreateUserSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.createUser.execute({
			adminUserId: currentUser.id,
			username: body.username,
			email: body.email,
			role: body.role as Role,
			now: new Date(),
		});
	}

	@Post('users/:userId/resend-password-setup')
	@HttpCode(200)
	async resendSetupEmail(
		@Param('userId', new ZodValidationPipe(adminIdParamSchema))
		userId: AdminIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.resendPasswordSetup.execute({
			adminUserId: currentUser.id,
			targetUserId: userId,
			now: new Date(),
		});
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
