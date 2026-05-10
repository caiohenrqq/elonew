import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import type { ListChatMessagesResponse } from '@modules/chat/application/use-cases/chat-response';
import { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type ChatOrderIdParamSchemaInput,
	chatOrderIdParamSchema,
	type ListChatMessagesQuerySchemaInput,
	listChatMessagesQuerySchema,
} from './chat.request-schemas';

@Controller('admin/orders/:orderId/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminChatController {
	constructor(
		private readonly listChatMessagesUseCase: ListChatMessagesUseCase,
	) {}

	@Get('messages')
	async listMessages(
		@Param('orderId', new ZodValidationPipe(chatOrderIdParamSchema))
		orderId: ChatOrderIdParamSchemaInput,
		@Query(new ZodValidationPipe(listChatMessagesQuerySchema))
		query: ListChatMessagesQuerySchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<ListChatMessagesResponse> {
		return await this.listChatMessagesUseCase.execute({
			orderId,
			userId: currentUser.id,
			role: currentUser.role,
			limit: query.limit,
			cursor: query.cursor,
		});
	}
}
