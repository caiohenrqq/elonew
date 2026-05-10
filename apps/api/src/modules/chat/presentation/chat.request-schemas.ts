import { z } from 'zod';

export const chatOrderIdParamSchema = z.string().trim().min(1);

export type ChatOrderIdParamSchemaInput = z.infer<
	typeof chatOrderIdParamSchema
>;

export const listChatMessagesQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	cursor: z.string().trim().min(1).optional(),
});

export type ListChatMessagesQuerySchemaInput = z.infer<
	typeof listChatMessagesQuerySchema
>;

export const sendChatMessageSchema = z.object({
	content: z.string().trim().min(1).max(2000),
});

export type SendChatMessageSchemaInput = z.infer<typeof sendChatMessageSchema>;
