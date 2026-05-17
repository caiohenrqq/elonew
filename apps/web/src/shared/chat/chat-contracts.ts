export {
	type SendChatMessageSchemaInput as SendChatMessageInput,
	sendChatMessageSchema as sendChatMessageInputSchema,
} from '@packages/shared/chat/send-chat-message.schema';

import { z } from 'zod';

export const chatMessageSenderSchema = z.object({
	id: z.string(),
	username: z.string(),
	role: z.enum(['CLIENT', 'BOOSTER', 'ADMIN']),
});

export const chatMessageSchema = z.object({
	id: z.string(),
	orderId: z.string(),
	chatId: z.string(),
	content: z.string(),
	sender: chatMessageSenderSchema,
	createdAt: z.string(),
});

export const listChatMessagesResponseSchema = z.object({
	items: z.array(chatMessageSchema),
	nextCursor: z.string().nullable(),
});

export type ChatMessageOutput = z.infer<typeof chatMessageSchema>;
export type ListChatMessagesResponseOutput = z.infer<
	typeof listChatMessagesResponseSchema
>;
