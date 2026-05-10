import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import type {
	ChatMessageResponse,
	ListChatMessagesResponse,
} from '@modules/chat/application/use-cases/chat-response';
import { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
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
	type ChatOrderIdParamSchemaInput,
	chatOrderIdParamSchema,
	type ListChatMessagesQuerySchemaInput,
	listChatMessagesQuerySchema,
	type SendChatMessageSchemaInput,
	sendChatMessageSchema,
} from './chat.request-schemas';

@Controller('orders/:orderId/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
	constructor(
		private readonly listChatMessagesUseCase: ListChatMessagesUseCase,
		private readonly sendChatMessageUseCase: SendChatMessageUseCase,
	) {}

	@Get('messages')
	@Roles(Role.CLIENT, Role.BOOSTER)
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

	@Post('messages')
	@Roles(Role.CLIENT, Role.BOOSTER)
	@HttpCode(201)
	async sendMessage(
		@Param('orderId', new ZodValidationPipe(chatOrderIdParamSchema))
		orderId: ChatOrderIdParamSchemaInput,
		@Body(new ZodValidationPipe(sendChatMessageSchema))
		body: SendChatMessageSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<ChatMessageResponse> {
		return await this.sendChatMessageUseCase.execute({
			orderId,
			userId: currentUser.id,
			role: currentUser.role,
			content: body.content,
		});
	}
}
