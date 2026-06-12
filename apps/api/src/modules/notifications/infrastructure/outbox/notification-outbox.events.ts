import type { OutboxEventInput } from '@app/common/outbox/outbox-event';
import {
	type NotificationsReadAllEvent,
	type NotificationUpdatedEvent,
	notificationsReadAllEventSchema,
	notificationUpdatedEventSchema,
} from '@packages/shared/notifications/notification.schema';
import { z } from 'zod';

export const NOTIFICATION_UPDATED_EVENT = 'notification.updated';
export const NOTIFICATION_READ_ALL_EVENT = 'notification.read-all';

const NOTIFICATION_AGGREGATE_TYPE = 'notification';

export const notificationUpdatedOutboxPayloadSchema = z.object({
	recipientId: z.string().min(1),
	event: notificationUpdatedEventSchema,
});

export const notificationReadAllOutboxPayloadSchema = z.object({
	recipientId: z.string().min(1),
	event: notificationsReadAllEventSchema,
});

export const buildNotificationUpdatedOutboxEvent = (
	recipientId: string,
	event: NotificationUpdatedEvent,
): OutboxEventInput => ({
	aggregateType: NOTIFICATION_AGGREGATE_TYPE,
	aggregateId: recipientId,
	eventType: NOTIFICATION_UPDATED_EVENT,
	payload: { recipientId, event },
});

export const buildNotificationReadAllOutboxEvent = (
	recipientId: string,
	event: NotificationsReadAllEvent,
): OutboxEventInput => ({
	aggregateType: NOTIFICATION_AGGREGATE_TYPE,
	aggregateId: recipientId,
	eventType: NOTIFICATION_READ_ALL_EVENT,
	payload: { recipientId, event },
});
