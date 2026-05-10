import {
	CHAT_REPOSITORY_KEY,
	type ChatRepositoryPort,
} from '@modules/chat/application/ports/chat-repository.port';
import {
	type ListChatMessagesResponse,
	mapListChatMessagesResponse,
} from '@modules/chat/application/use-cases/chat-response';
import {
	ChatForbiddenError,
	ChatOrderNotFoundError,
} from '@modules/chat/domain/chat.errors';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type ListChatMessagesInput = {
	orderId: string;
	userId: string;
	role: Role;
	limit: number;
	cursor?: string;
};

@Injectable()
export class ListChatMessagesUseCase {
	constructor(
		@Inject(CHAT_REPOSITORY_KEY)
		private readonly chatRepository: ChatRepositoryPort,
	) {}

	async execute(
		input: ListChatMessagesInput,
	): Promise<ListChatMessagesResponse> {
		const order = await this.chatRepository.findOrderChat(input.orderId);
		if (!order) throw new ChatOrderNotFoundError();
		if (!this.canRead(input, order)) throw new ChatOrderNotFoundError();
		if (!order.chatId) return { items: [], nextCursor: null };

		return mapListChatMessagesResponse(
			await this.chatRepository.listMessages({
				chatId: order.chatId,
				limit: input.limit,
				cursor: input.cursor,
			}),
		);
	}

	private canRead(
		input: Pick<ListChatMessagesInput, 'role' | 'userId'>,
		order: {
			clientId: string | null;
			boosterId: string | null;
		},
	): boolean {
		if (input.role === Role.ADMIN) return true;
		if (input.role === Role.CLIENT) return order.clientId === input.userId;
		if (input.role === Role.BOOSTER) return order.boosterId === input.userId;

		throw new ChatForbiddenError();
	}
}
