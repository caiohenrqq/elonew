import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from './notification-service';

const notification = {
	id: 'notification-1',
	type: 'CHAT_MESSAGE_CREATED',
	payload: {
		type: 'CHAT_MESSAGE_CREATED',
		metadata: {
			orderId: 'order-1',
			chatMessageId: 'message-1',
			senderId: 'booster-1',
			senderUsername: 'Booster',
		},
	},
	readAt: null,
	activityAt: '2026-05-18T11:00:00.000Z',
	createdAt: '2026-05-18T11:00:00.000Z',
	updatedAt: '2026-05-18T11:00:00.000Z',
};

describe('notification service', () => {
	it('uses authenticated requests for listing notifications', async () => {
		const apiRequest = jest.fn().mockResolvedValue({
			items: [notification],
			nextCursor: null,
			unreadCount: 1,
		});

		await expect(listNotifications(apiRequest)).resolves.toEqual({
			items: [notification],
			nextCursor: null,
			unreadCount: 1,
		});
		expect(apiRequest).toHaveBeenCalledWith('/notifications?limit=10', {
			auth: true,
		});
	});

	it('sends the expected activity timestamp when marking one notification read', async () => {
		const readNotification = {
			...notification,
			readAt: '2026-05-18T12:00:00.000Z',
		};
		const apiRequest = jest.fn().mockResolvedValue(readNotification);

		await expect(
			markNotificationRead(
				'notification-1',
				'2026-05-18T11:00:00.000Z',
				apiRequest,
			),
		).resolves.toEqual(readNotification);
		expect(apiRequest).toHaveBeenCalledWith(
			'/notifications/notification-1/read',
			{
				auth: true,
				method: 'PATCH',
				body: JSON.stringify({
					expectedActivityAt: '2026-05-18T11:00:00.000Z',
				}),
			},
		);
	});

	it('parses the mark-all response from the backend', async () => {
		const response = {
			cutoffActivityAt: '2026-05-18T12:00:00.000Z',
			unreadCount: 1,
			updatedCount: 2,
		};
		const apiRequest = jest.fn().mockResolvedValue(response);

		await expect(markAllNotificationsRead(apiRequest)).resolves.toEqual(
			response,
		);
		expect(apiRequest).toHaveBeenCalledWith('/notifications/read-all', {
			auth: true,
			method: 'PATCH',
		});
	});
});
