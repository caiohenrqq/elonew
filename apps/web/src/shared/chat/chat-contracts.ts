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

export const sendChatMessageInputSchema = z.object({
	content: z.string().trim().min(1).max(2000),
});

export type ChatMessageOutput = z.infer<typeof chatMessageSchema>;
export type ListChatMessagesResponseOutput = z.infer<
	typeof listChatMessagesResponseSchema
>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageInputSchema>;
