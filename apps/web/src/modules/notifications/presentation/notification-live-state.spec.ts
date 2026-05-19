import type { ListNotificationsResponse } from '@/shared/notifications/notification-contracts';
import {
	applyNotificationsReadAll,
	applyNotificationUpdated,
} from './notification-live-state';

const makeNotification = (input: {
	id: string;
	chatMessageId: string;
	activityAt: string;
	readAt?: string | null;
	updatedAt: string;
}) => ({
	id: input.id,
	type: 'CHAT_MESSAGE_CREATED' as const,
	payload: {
		type: 'CHAT_MESSAGE_CREATED' as const,
		metadata: {
			orderId: 'order-1',
			chatMessageId: input.chatMessageId,
			senderId: 'booster-1',
			senderUsername: 'Booster',
		},
	},
	readAt: input.readAt ?? null,
	activityAt: input.activityAt,
	createdAt: '2026-05-18T10:00:00.000Z',
	updatedAt: input.updatedAt,
});

describe('notification live state', () => {
	it('deduplicates socket updates and keeps newest notifications first', () => {
		const state: ListNotificationsResponse = {
			items: [
				makeNotification({
					id: 'notification-1',
					chatMessageId: 'message-1',
					activityAt: '2026-05-18T10:00:00.000Z',
					updatedAt: '2026-05-18T10:00:00.000Z',
				}),
			],
			nextCursor: null,
			unreadCount: 1,
		};

		const next = applyNotificationUpdated(
			state,
			makeNotification({
				id: 'notification-1',
				chatMessageId: 'message-2',
				activityAt: '2026-05-18T12:00:00.000Z',
				updatedAt: '2026-05-18T12:00:00.000Z',
			}),
			1,
		);

		expect(next.items).toHaveLength(1);
		expect(next.items[0]?.payload.metadata.chatMessageId).toBe('message-2');
		expect(next.unreadCount).toBe(1);
	});

	it('marks cutoff-eligible local notifications read after a read-all socket event', () => {
		const state: ListNotificationsResponse = {
			items: [
				makeNotification({
					id: 'notification-1',
					chatMessageId: 'message-1',
					activityAt: '2026-05-18T10:00:00.000Z',
					updatedAt: '2026-05-18T10:00:00.000Z',
				}),
				makeNotification({
					id: 'notification-2',
					chatMessageId: 'message-2',
					activityAt: '2026-05-18T13:00:00.000Z',
					updatedAt: '2026-05-18T13:00:00.000Z',
				}),
			],
			nextCursor: null,
			unreadCount: 2,
		};

		const next = applyNotificationsReadAll(
			state,
			'2026-05-18T12:00:00.000Z',
			'2026-05-18T12:00:00.000Z',
			1,
		);

		expect(next.unreadCount).toBe(1);
		expect(next.items[0]?.readAt).toBe('2026-05-18T12:00:00.000Z');
		expect(next.items[1]?.readAt).toBeNull();
	});
});
