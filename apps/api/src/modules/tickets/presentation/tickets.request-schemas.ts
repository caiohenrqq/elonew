import { TicketStatus } from '@modules/tickets/domain/ticket.entity';
import { z } from 'zod';

export const ticketIdParamSchema = z.string().trim().min(1);

export type TicketIdParamSchemaInput = z.infer<typeof ticketIdParamSchema>;

export const createTicketSchema = z.object({
	subject: z.string().trim().min(3).max(160),
	content: z.string().trim().min(1).max(5000),
	orderId: z.string().trim().min(1).optional(),
});

export type CreateTicketSchemaInput = z.infer<typeof createTicketSchema>;

export const addTicketMessageSchema = z.object({
	content: z.string().trim().min(1).max(5000),
});

export type AddTicketMessageSchemaInput = z.infer<
	typeof addTicketMessageSchema
>;

export const listTicketsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListTicketsQuerySchemaInput = z.infer<
	typeof listTicketsQuerySchema
>;

export const listAdminTicketsQuerySchema = listTicketsQuerySchema.extend({
	status: z.nativeEnum(TicketStatus).optional(),
	query: z.string().trim().min(1).max(120).optional(),
});

export type ListAdminTicketsQuerySchemaInput = z.infer<
	typeof listAdminTicketsQuerySchema
>;

export const updateTicketStatusSchema = z.object({
	status: z.nativeEnum(TicketStatus),
});

export type UpdateTicketStatusSchemaInput = z.infer<
	typeof updateTicketStatusSchema
>;
