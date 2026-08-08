export {
	type AdminGovernanceInput,
	adminGovernanceInputSchema,
} from '@packages/shared/admin/admin-governance.schema';

import { z } from 'zod';

export const adminCreateUserInputSchema = z.object({
	username: z.string().trim().min(1, 'Informe o nome de usuário.'),
	email: z.string().trim().email('Informe um e-mail válido.'),
	role: z.enum(['CLIENT', 'BOOSTER', 'ADMIN']),
});

export const adminRenameUserInputSchema = z.object({
	targetId: z.string().trim().min(1),
	username: z.string().trim().min(1, 'Informe o nome de usuário.').max(120),
});

export const adminChangeUserRoleInputSchema = z.object({
	targetId: z.string().trim().min(1),
	role: z.enum(['CLIENT', 'BOOSTER', 'ADMIN']),
});

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
	activationStatus: z.enum(['ACTIVE', 'PENDING_ACTIVATION', 'INACTIVE']),
	createdAt: z.string(),
});

export const adminOrderSchema = z.object({
	id: z.string(),
	clientId: z.string().nullable(),
	boosterId: z.string().nullable(),
	status: z.string(),
	serviceType: z.string().nullable(),
	summonerName: z.string().nullable().optional(),
	currentLeague: z.string().nullable().optional(),
	currentDivision: z.string().nullable().optional(),
	currentLp: z.number().nullable().optional(),
	desiredLeague: z.string().nullable().optional(),
	desiredDivision: z.string().nullable().optional(),
	server: z.string().nullable().optional(),
	desiredQueue: z.string().nullable().optional(),
	lpGain: z.number().nullable().optional(),
	subtotal: z.number().nullable().optional(),
	totalAmount: z.number().nullable(),
	discountAmount: z.number().optional(),
	extras: z.array(z.object({ type: z.string(), price: z.number() })).optional(),
	client: z.object({ username: z.string() }).nullable().optional(),
	booster: z.object({ username: z.string() }).nullable().optional(),
	createdAt: z.string(),
	latestGovernanceAction: z
		.object({
			type: z.string(),
			reason: z.string(),
			createdAt: z.string(),
		})
		.nullable(),
	boosterPayment: z
		.object({
			amount: z.number(),
			availableAt: z.string(),
			releasedAt: z.string().nullable(),
			releasedBy: z.enum(['schedule', 'admin']).nullable(),
		})
		.nullable()
		.default(null),
});

export const adminScheduledJobsSchema = z.object({
	queues: z.array(
		z.object({
			queueName: z.string(),
			counts: z.object({
				delayed: z.number(),
				waiting: z.number(),
				active: z.number(),
				failed: z.number(),
				completed: z.number(),
			}),
			schedulers: z.array(
				z.object({
					name: z.string(),
					cron: z.string().nullable(),
					nextRunAt: z.string().nullable(),
				}),
			),
			pending: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					dueAt: z.string().nullable(),
				}),
			),
		}),
	),
	inProcess: z.array(
		z.object({
			name: z.string(),
			interval: z.string(),
			location: z.string(),
		}),
	),
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

export const adminWithdrawalRequestSchema = z.object({
	id: z.string(),
	boosterId: z.string(),
	boosterUsername: z.string(),
	amount: z.number().int().positive(),
	payoutPixKey: z.string().min(1).nullable(),
	createdAt: z.string(),
});

export const adminDashboardSchema = z.object({
	metrics: adminMetricsSchema,
	users: z.array(adminUserSchema),
	orders: z.array(adminOrderSchema),
	tickets: z.array(adminSupportTicketSchema),
	withdrawals: z.array(adminWithdrawalRequestSchema),
});

export type AdminMetricsOutput = z.infer<typeof adminMetricsSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserInputSchema>;
export type AdminRenameUserInput = z.infer<typeof adminRenameUserInputSchema>;
export type AdminChangeUserRoleInput = z.infer<
	typeof adminChangeUserRoleInputSchema
>;
export type AdminUserOutput = z.infer<typeof adminUserSchema>;
export type AdminOrderOutput = z.infer<typeof adminOrderSchema>;
export type AdminSupportTicketOutput = z.infer<typeof adminSupportTicketSchema>;
export type AdminWithdrawalRequestOutput = z.infer<
	typeof adminWithdrawalRequestSchema
>;
export type AdminScheduledJobsOutput = z.infer<typeof adminScheduledJobsSchema>;
export type AdminDashboardOutput = z.infer<typeof adminDashboardSchema>;
