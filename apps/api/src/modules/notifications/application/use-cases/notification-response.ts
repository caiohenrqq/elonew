import type {
	ListNotificationsResponse,
	NotificationOutput,
	NotificationsReadAllEvent,
	NotificationUpdatedEvent,
} from '@packages/shared/notifications/notification.schema';
import type {
	ListNotificationsOutput,
	NotificationRecord,
} from '../ports/notification-repository.port';

export type NotificationResponse = NotificationOutput;
export type NotificationUpdatedEventResponse = NotificationUpdatedEvent;
export type NotificationsReadAllEventResponse = NotificationsReadAllEvent;

export const mapNotificationResponse = (
	record: NotificationRecord,
): NotificationResponse => ({
	id: record.id,
	type: record.type,
	payload: record.payload,
	readAt: record.readAt?.toISOString() ?? null,
	activityAt: record.activityAt.toISOString(),
	createdAt: record.createdAt.toISOString(),
	updatedAt: record.updatedAt.toISOString(),
});

export const mapListNotificationsResponse = (
	output: ListNotificationsOutput,
): ListNotificationsResponse => ({
	items: output.items.map(mapNotificationResponse),
	nextCursor: output.nextCursor,
	unreadCount: output.unreadCount,
});

export const mapNotificationUpdatedEventResponse = (
	notification: NotificationRecord,
	unreadCount: number,
): NotificationUpdatedEventResponse => ({
	notification: mapNotificationResponse(notification),
	unreadCount,
});

export const mapNotificationsReadAllEventResponse = (
	readAt: Date,
	cutoffActivityAt: Date,
	unreadCount: number,
): NotificationsReadAllEventResponse => ({
	readAt: readAt.toISOString(),
	cutoffActivityAt: cutoffActivityAt.toISOString(),
	unreadCount,
});
