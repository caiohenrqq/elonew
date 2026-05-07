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

export const adminSupportTicketSchema = z.object({
	id: z.string(),
	userId: z.string(),
	subject: z.string(),
	status: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	messageCount: z.number().int().nonnegative(),
	latestMessageAt: z.string().nullable(),
});

export const adminDashboardSchema = z.object({
	metrics: adminMetricsSchema,
	users: z.array(adminUserSchema),
	orders: z.array(adminOrderSchema),
	tickets: z.array(adminSupportTicketSchema),
});

export const adminGovernanceInputSchema = z.object({
	targetId: z.string().trim().min(1),
	reason: z.string().trim().min(1).max(500),
});

export type AdminMetricsOutput = z.infer<typeof adminMetricsSchema>;
export type AdminUserOutput = z.infer<typeof adminUserSchema>;
export type AdminOrderOutput = z.infer<typeof adminOrderSchema>;
export type AdminSupportTicketOutput = z.infer<typeof adminSupportTicketSchema>;
export type AdminDashboardOutput = z.infer<typeof adminDashboardSchema>;
