import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { ListNotificationsUseCase } from '@modules/notifications/application/use-cases/list-notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@modules/notifications/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@modules/notifications/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import type { NotificationResponse } from '@modules/notifications/application/use-cases/notification-response';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import type {
	ListNotificationsResponse,
	MarkAllNotificationsReadResponse,
} from '@packages/shared/notifications/notification.schema';
import {
	type ListNotificationsQuery,
	listNotificationsQuerySchema,
	type MarkNotificationReadInput,
	markNotificationReadSchema,
	type NotificationIdParamSchemaInput,
	notificationIdParamSchema,
} from './notifications.request-schemas';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT, Role.BOOSTER, Role.ADMIN)
export class NotificationsController {
	constructor(
		private readonly listNotificationsUseCase: ListNotificationsUseCase,
		private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
		private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
	) {}

	@Get()
	async list(
		@Query(new ZodValidationPipe(listNotificationsQuerySchema))
		query: ListNotificationsQuery,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<ListNotificationsResponse> {
		return await this.listNotificationsUseCase.execute({
			recipientId: currentUser.id,
			limit: query.limit,
			cursor: query.cursor,
		});
	}

	@Patch(':notificationId/read')
	@HttpCode(200)
	async markRead(
		@Param('notificationId', new ZodValidationPipe(notificationIdParamSchema))
		notificationId: NotificationIdParamSchemaInput,
		@Body(new ZodValidationPipe(markNotificationReadSchema))
		body: MarkNotificationReadInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<NotificationResponse> {
		return await this.markNotificationReadUseCase.execute({
			notificationId,
			recipientId: currentUser.id,
			readAt: new Date(),
			...(body.expectedActivityAt
				? { expectedActivityAt: new Date(body.expectedActivityAt) }
				: {}),
		});
	}

	@Patch('read-all')
	@HttpCode(200)
	async markAllRead(
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<MarkAllNotificationsReadResponse> {
		return await this.markAllNotificationsReadUseCase.execute({
			recipientId: currentUser.id,
			readAt: new Date(),
		});
	}
}
