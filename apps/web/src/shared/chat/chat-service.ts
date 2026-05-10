import {
	type ChatMessageOutput,
	chatMessageSchema,
	type ListChatMessagesResponseOutput,
	listChatMessagesResponseSchema,
	type SendChatMessageInput,
	sendChatMessageInputSchema,
} from './chat-contracts';

export type AuthenticatedApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => Promise<T>;

const getOrderChatMessagesPath = (orderId: string) =>
	`/orders/${encodeURIComponent(orderId)}/chat/messages`;

const getAdminOrderChatMessagesPath = (orderId: string) =>
	`/admin/orders/${encodeURIComponent(orderId)}/chat/messages`;

export const listOrderChatMessages = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<ListChatMessagesResponseOutput> => {
	const response = await apiRequest<unknown>(
		`${getOrderChatMessagesPath(orderId)}?limit=50`,
		{ auth: true },
	);

	return listChatMessagesResponseSchema.parse(response);
};

export const listAdminOrderChatMessages = async (
	orderId: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<ListChatMessagesResponseOutput> => {
	const response = await apiRequest<unknown>(
		`${getAdminOrderChatMessagesPath(orderId)}?limit=50`,
		{ auth: true },
	);

	return listChatMessagesResponseSchema.parse(response);
};

export const sendOrderChatMessage = async (
	orderId: string,
	input: SendChatMessageInput,
	apiRequest: AuthenticatedApiRequest,
): Promise<ChatMessageOutput> => {
	const body = sendChatMessageInputSchema.parse(input);
	const response = await apiRequest<unknown>(
		getOrderChatMessagesPath(orderId),
		{
			auth: true,
			method: 'POST',
			body: JSON.stringify(body),
		},
	);

	return chatMessageSchema.parse(response);
};
