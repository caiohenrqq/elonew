import type {
	NotificationPayload,
	NotificationType,
} from '@packages/shared/notifications/notification.schema';

export const NOTIFICATION_REPOSITORY_KEY = Symbol(
	'NOTIFICATION_REPOSITORY_KEY',
);

export type NotificationRecord = {
	id: string;
	recipientId: string;
	type: NotificationType;
	aggregateKey: string;
	payload: NotificationPayload;
	readAt: Date | null;
	activityAt: Date;
	createdAt: Date;
	updatedAt: Date;
};

export type ListNotificationsInput = {
	recipientId: string;
	limit: number;
	cursor?: string;
};

export type ListNotificationsOutput = {
	items: NotificationRecord[];
	nextCursor: string | null;
	unreadCount: number;
};

export type UpsertNotificationInput = {
	recipientId: string;
	type: NotificationType;
	aggregateKey: string;
	payload: NotificationPayload;
};

export type MarkAllNotificationsReadResult = {
	updatedCount: number;
	unreadCount: number;
};

export interface NotificationRepositoryPort {
	countUnread(recipientId: string): Promise<number>;
	list(input: ListNotificationsInput): Promise<ListNotificationsOutput>;
	markRead(input: {
		notificationId: string;
		recipientId: string;
		readAt: Date;
		expectedActivityAt?: Date;
	}): Promise<NotificationRecord | 'changed' | null>;
	markAllRead(input: {
		recipientId: string;
		readAt: Date;
		cutoffActivityAt: Date;
	}): Promise<MarkAllNotificationsReadResult>;
	upsert(input: UpsertNotificationInput): Promise<NotificationRecord>;
}
