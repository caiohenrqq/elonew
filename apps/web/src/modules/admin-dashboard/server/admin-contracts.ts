export {
	type AdminGovernanceInput,
	adminGovernanceInputSchema,
} from '@packages/shared/admin/admin-governance.schema';

import { z } from 'zod';

export const adminMetricsSchema = z.object({
	revenueTotal: z.number(),
	ordersTotal: z.number().int().nonnegative(),
	activeOrders: z.number().int().nonnegative(),
	activeUsers: z.number().int().nonnegative(),
});

export const adminUserSchema = z.object({
	id: z.string(),
	username: z.string(),
	email: z.string(),
	role: z.string(),
	isActive: z.boolean(),
	isBlocked: z.boolean(),
	createdAt: z.string(),
});

export const adminOrderSchema = z.object({
	id: z.string(),
	clientId: z.string().nullable(),
	boosterId: z.string().nullable(),
	status: z.string(),
	serviceType: z.string().nullable(),
	totalAmount: z.number().nullable(),
	createdAt: z.string(),
	latestGovernanceAction: z
		.object({
			type: z.string(),
			reason: z.string(),
			createdAt: z.string(),
		})
		.nullable(),
});

export const adminTicketStatusSchema = z.enum([
	'OPEN',
	'WAITING_USER',
	'WAITING_SUPPORT',
	'CLOSED',
]);

export const adminTicketSenderRoleSchema = z.enum([
	'ADMIN',
	'BOOSTER',
	'CLIENT',
]);

export const adminSupportTicketSchema = z.object({
	id: z.string(),
	userId: z.string(),
	orderId: z.string().nullable().default(null),
	subject: z.string(),
	status: adminTicketStatusSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
	messageCount: z.number().int().nonnegative(),
	latestMessageAt: z.string().nullable(),
});

export const adminTicketMessageSchema = z.object({
	id: z.string(),
	ticketId: z.string(),
	senderId: z.string(),
	senderRole: adminTicketSenderRoleSchema,
	content: z.string(),
	createdAt: z.string(),
});

export const adminTicketDetailSchema = adminSupportTicketSchema
	.omit({ messageCount: true, latestMessageAt: true })
	.extend({
		messages: z.array(adminTicketMessageSchema),
	});

export const listAdminTicketsInputSchema = z.object({
	limit: z.number().int().min(1).max(100).default(25),
	status: adminTicketStatusSchema.optional(),
	query: z.string().trim().min(1).max(120).optional(),
});

export const replyAdminTicketInputSchema = z.object({
	ticketId: z.string().trim().min(1),
	content: z.string().trim().min(1).max(5000),
});

export const updateAdminTicketStatusInputSchema = z.object({
	ticketId: z.string().trim().min(1),
	status: adminTicketStatusSchema,
});

export const adminDashboardSchema = z.object({
	metrics: adminMetricsSchema,
	users: z.array(adminUserSchema),
	orders: z.array(adminOrderSchema),
	tickets: z.array(adminSupportTicketSchema),
});

export type AdminMetricsOutput = z.infer<typeof adminMetricsSchema>;
export type AdminUserOutput = z.infer<typeof adminUserSchema>;
export type AdminOrderOutput = z.infer<typeof adminOrderSchema>;
export type AdminTicketStatus = z.infer<typeof adminTicketStatusSchema>;
export type AdminTicketSenderRole = z.infer<typeof adminTicketSenderRoleSchema>;
export type AdminSupportTicketOutput = z.infer<typeof adminSupportTicketSchema>;
export type AdminTicketMessageOutput = z.infer<typeof adminTicketMessageSchema>;
export type AdminTicketDetailOutput = z.infer<typeof adminTicketDetailSchema>;
export type ListAdminTicketsInput = z.infer<typeof listAdminTicketsInputSchema>;
export type ReplyAdminTicketInput = z.infer<typeof replyAdminTicketInputSchema>;
export type UpdateAdminTicketStatusInput = z.infer<
	typeof updateAdminTicketStatusInputSchema
>;
export type AdminDashboardOutput = z.infer<typeof adminDashboardSchema>;
