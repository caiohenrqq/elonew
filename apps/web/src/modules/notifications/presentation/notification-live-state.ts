import type {
	ListNotificationsResponse,
	NotificationOutput,
} from '@/shared/notifications/notification-contracts';

export const DASHBOARD_NOTIFICATION_LIST_LIMIT = 10;

export const applyNotificationUpdated = (
	state: ListNotificationsResponse,
	notification: NotificationOutput,
	unreadCount: number,
): ListNotificationsResponse => {
	const byId = new Map(state.items.map((item) => [item.id, item] as const));
	byId.set(notification.id, notification);

	return {
		...state,
		items: [...byId.values()]
			.sort(compareNotificationsByActivity)
			.slice(0, DASHBOARD_NOTIFICATION_LIST_LIMIT),
		unreadCount,
	};
};

export const applyNotificationsReadAll = (
	state: ListNotificationsResponse,
	readAt: string,
	cutoffActivityAt: string,
	unreadCount: number,
): ListNotificationsResponse => ({
	...state,
	items: state.items.map((notification) => ({
		...notification,
		readAt:
			notification.readAt ??
			(new Date(notification.activityAt).getTime() <=
			new Date(cutoffActivityAt).getTime()
				? readAt
				: null),
	})),
	unreadCount,
});

export const replaceNotifications = (
	_state: ListNotificationsResponse,
	next: ListNotificationsResponse,
): ListNotificationsResponse => next;

const compareNotificationsByActivity = (
	left: NotificationOutput,
	right: NotificationOutput,
) => {
	const activityAtDifference =
		new Date(right.activityAt).getTime() - new Date(left.activityAt).getTime();
	if (activityAtDifference !== 0) return activityAtDifference;

	return right.id.localeCompare(left.id);
};
