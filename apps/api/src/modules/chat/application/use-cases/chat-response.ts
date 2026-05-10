import type {
	ChatMessageRecord,
	ListChatMessagesOutput,
} from '@modules/chat/application/ports/chat-repository.port';
import type { Role } from '@packages/auth/roles/role';

export type ChatMessageResponse = {
	id: string;
	orderId: string;
	chatId: string;
	content: string;
	sender: {
		id: string;
		username: string;
		role: Role;
	};
	createdAt: string;
};

export type ListChatMessagesResponse = {
	items: ChatMessageResponse[];
	nextCursor: string | null;
};

export const mapChatMessageResponse = (
	message: ChatMessageRecord,
): ChatMessageResponse => ({
	id: message.id,
	orderId: message.orderId,
	chatId: message.chatId,
	content: message.content,
	sender: message.sender,
	createdAt: message.createdAt.toISOString(),
});

export const mapListChatMessagesResponse = (
	result: ListChatMessagesOutput,
): ListChatMessagesResponse => ({
	items: result.items.map(mapChatMessageResponse),
	nextCursor: result.nextCursor,
});
