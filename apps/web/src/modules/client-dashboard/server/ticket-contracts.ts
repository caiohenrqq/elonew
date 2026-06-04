import { z } from 'zod';

export const createSupportTicketInputSchema = z.object({
	subject: z.string().trim().min(3).max(160),
	content: z.string().trim().min(1).max(5000),
	orderId: z.string().trim().min(1).optional(),
});

export type CreateSupportTicketInput = z.infer<
	typeof createSupportTicketInputSchema
>;

export const supportTicketSchema = z.object({
	id: z.string(),
	userId: z.string(),
	orderId: z.string().nullable(),
	subject: z.string(),
	status: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	messageCount: z.number().int().nonnegative().optional(),
	latestMessageAt: z.string().nullable().optional(),
});

export type SupportTicketOutput = z.infer<typeof supportTicketSchema>;
