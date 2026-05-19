import { z } from 'zod';

export const notificationTypeSchema = z.enum(['CHAT_MESSAGE_CREATED']);

export const chatMessageNotificationPayloadSchema = z.object({
	orderId: z.string().min(1),
	chatMessageId: z.string().min(1),
	senderId: z.string().min(1),
	senderUsername: z.string().min(1),
});

export const notificationPayloadSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('CHAT_MESSAGE_CREATED'),
		metadata: chatMessageNotificationPayloadSchema,
	}),
]);

export const notificationSchema = z.object({
	id: z.string(),
	type: notificationTypeSchema,
	payload: notificationPayloadSchema,
	readAt: z.string().datetime().nullable(),
	activityAt: z.string().datetime(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const listNotificationsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
	cursor: z.string().trim().min(1).optional(),
});

export const notificationIdParamSchema = z.string().trim().min(1);

export const markNotificationReadSchema = z
	.object({
		expectedActivityAt: z.string().datetime().optional(),
	})
	.default({});

export const listNotificationsResponseSchema = z.object({
	items: z.array(notificationSchema),
	nextCursor: z.string().nullable(),
	unreadCount: z.number().int().nonnegative(),
});

export const notificationUpdatedEventSchema = z.object({
	notification: notificationSchema,
	unreadCount: z.number().int().nonnegative(),
});

export const notificationsReadAllEventSchema = z.object({
	readAt: z.string().datetime(),
	cutoffActivityAt: z.string().datetime(),
	unreadCount: z.number().int().nonnegative(),
});

export const markAllNotificationsReadResponseSchema = z.object({
	updatedCount: z.number().int().nonnegative(),
	cutoffActivityAt: z.string().datetime(),
	unreadCount: z.number().int().nonnegative(),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type ChatMessageNotificationPayload = z.infer<
	typeof chatMessageNotificationPayloadSchema
>;
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
export type NotificationOutput = z.infer<typeof notificationSchema>;
export type ListNotificationsQueryInput = z.input<
	typeof listNotificationsQuerySchema
>;
export type ListNotificationsQuery = z.infer<
	typeof listNotificationsQuerySchema
>;
export type ListNotificationsResponse = z.infer<
	typeof listNotificationsResponseSchema
>;
export type MarkNotificationReadInput = z.infer<
	typeof markNotificationReadSchema
>;
export type NotificationUpdatedEvent = z.infer<
	typeof notificationUpdatedEventSchema
>;
export type NotificationsReadAllEvent = z.infer<
	typeof notificationsReadAllEventSchema
>;
export type MarkAllNotificationsReadResponse = z.infer<
	typeof markAllNotificationsReadResponseSchema
>;
