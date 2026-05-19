import {
	type ListNotificationsResponse,
	listNotificationsResponseSchema,
	type MarkAllNotificationsReadResponse,
	markAllNotificationsReadResponseSchema,
	type NotificationOutput,
	notificationSchema,
} from './notification-contracts';

type AuthenticatedApiRequest = <T>(
	path: string,
	init: RequestInit & { auth: true },
) => Promise<T>;

export const listNotifications = async (
	apiRequest: AuthenticatedApiRequest,
	limit = 10,
): Promise<ListNotificationsResponse> => {
	const response = await apiRequest<unknown>(
		`/notifications?limit=${encodeURIComponent(String(limit))}`,
		{ auth: true },
	);

	return listNotificationsResponseSchema.parse(response);
};

export const markNotificationRead = async (
	notificationId: string,
	expectedActivityAt: string,
	apiRequest: AuthenticatedApiRequest,
): Promise<NotificationOutput> => {
	const response = await apiRequest<unknown>(
		`/notifications/${encodeURIComponent(notificationId)}/read`,
		{
			auth: true,
			method: 'PATCH',
			body: JSON.stringify({ expectedActivityAt }),
		},
	);

	return notificationSchema.parse(response);
};

export const markAllNotificationsRead = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<MarkAllNotificationsReadResponse> => {
	const response = await apiRequest<unknown>('/notifications/read-all', {
		auth: true,
		method: 'PATCH',
	});

	return markAllNotificationsReadResponseSchema.parse(response);
};
