export type ChatMessageSender = {
	id: string;
	username: string;
	role: 'CLIENT' | 'BOOSTER' | 'ADMIN';
};

export type ChatMessage = {
	id: string;
	orderId: string;
	chatId: string;
	content: string;
	sender: ChatMessageSender;
	createdAt: string;
};

export type ListChatMessagesResponse = {
	items: ChatMessage[];
	nextCursor: string | null;
};

export type ChatState = {
	messages: ChatMessage[];
	isLoading: boolean;
	isSending: boolean;
	error: string | null;
};

export type ChatRoleLabel = Record<ChatMessageSender['role'], string>;
