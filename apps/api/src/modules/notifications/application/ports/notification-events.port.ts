import type {
	NotificationsReadAllEventResponse,
	NotificationUpdatedEventResponse,
} from '@modules/notifications/application/use-cases/notification-response';

export const NOTIFICATION_EVENTS_KEY = Symbol('NOTIFICATION_EVENTS_KEY');

export interface NotificationEventsPort {
	emitNotificationUpdated(
		recipientId: string,
		event: NotificationUpdatedEventResponse,
	): void;
	emitNotificationsReadAll(
		recipientId: string,
		event: NotificationsReadAllEventResponse,
	): void;
}
