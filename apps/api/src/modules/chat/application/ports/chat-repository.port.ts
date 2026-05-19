import type { Role } from '@packages/auth/roles/role';
import type { NotificationOutput } from '@packages/shared/notifications/notification.schema';

export const CHAT_REPOSITORY_KEY = Symbol('CHAT_REPOSITORY_KEY');

export type ChatOrderRecord = {
	orderId: string;
	clientId: string | null;
	boosterId: string | null;
	status: string;
	chatId: string | null;
};

export type ChatMessageRecord = {
	id: string;
	orderId: string;
	chatId: string;
	content: string;
	sender: {
		id: string;
		username: string;
		role: Role;
	};
	createdAt: Date;
};

export type ChatNotificationWriteInput = {
	recipientId: string;
};

export type ChatMessageWriteResult = {
	message: ChatMessageRecord;
	notification?: {
		notification: NotificationOutput;
		unreadCount: number;
	};
};

export type ListChatMessagesInput = {
	chatId: string;
	limit: number;
	cursor?: string;
};

export type ListChatMessagesOutput = {
	items: ChatMessageRecord[];
	nextCursor: string | null;
};

export interface ChatRepositoryPort {
	findOrderChat(orderId: string): Promise<ChatOrderRecord | null>;
	createOrderChat(orderId: string): Promise<{ id: string; orderId: string }>;
	createMessage(input: {
		chatId: string;
		senderId: string;
		content: string;
	}): Promise<ChatMessageRecord>;
	createMessageWithNotification(input: {
		chatId: string;
		senderId: string;
		content: string;
		notification?: ChatNotificationWriteInput;
	}): Promise<ChatMessageWriteResult>;
	listMessages(input: ListChatMessagesInput): Promise<ListChatMessagesOutput>;
}
