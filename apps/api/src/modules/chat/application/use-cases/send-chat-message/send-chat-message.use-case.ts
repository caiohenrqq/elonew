import {
	CHAT_REPOSITORY_KEY,
	type ChatRepositoryPort,
} from '@modules/chat/application/ports/chat-repository.port';
import {
	type ChatMessageResponse,
	mapChatMessageResponse,
} from '@modules/chat/application/use-cases/chat-response';
import {
	ChatForbiddenError,
	ChatNotWritableError,
	ChatOrderNotFoundError,
} from '@modules/chat/domain/chat.errors';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type SendChatMessageInput = {
	orderId: string;
	userId: string;
	role: Role;
	content: string;
};

const WRITABLE_ORDER_STATUS = 'in_progress';

@Injectable()
export class SendChatMessageUseCase {
	constructor(
		@Inject(CHAT_REPOSITORY_KEY)
		private readonly chatRepository: ChatRepositoryPort,
	) {}

	async execute(input: SendChatMessageInput): Promise<ChatMessageResponse> {
		const order = await this.chatRepository.findOrderChat(input.orderId);
		if (!order) throw new ChatOrderNotFoundError();
		if (!this.canWrite(input, order)) throw new ChatOrderNotFoundError();
		if (order.status !== WRITABLE_ORDER_STATUS)
			throw new ChatNotWritableError();
		if (!order.chatId) throw new ChatOrderNotFoundError();

		return mapChatMessageResponse(
			await this.chatRepository.createMessage({
				chatId: order.chatId,
				senderId: input.userId,
				content: input.content,
			}),
		);
	}

	private canWrite(
		input: Pick<SendChatMessageInput, 'role' | 'userId'>,
		order: {
			clientId: string | null;
			boosterId: string | null;
		},
	): boolean {
		if (input.role === Role.ADMIN) throw new ChatForbiddenError();
		if (input.role === Role.CLIENT) return order.clientId === input.userId;
		if (input.role === Role.BOOSTER) return order.boosterId === input.userId;

		throw new ChatForbiddenError();
	}
}
