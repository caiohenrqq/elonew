import type { NotificationEventsPort } from '@modules/notifications/application/ports/notification-events.port';
import type {
	ListNotificationsInput,
	ListNotificationsOutput,
	NotificationRecord,
	NotificationRepositoryPort,
	UpsertNotificationInput,
} from '@modules/notifications/application/ports/notification-repository.port';
import { ListNotificationsUseCase } from '@modules/notifications/application/use-cases/list-notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@modules/notifications/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@modules/notifications/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import { UpsertChatNotificationUseCase } from '@modules/notifications/application/use-cases/upsert-chat-notification/upsert-chat-notification.use-case';
import {
	NotificationNotFoundError,
	NotificationReadConflictError,
} from '@modules/notifications/domain/notification.errors';

class InMemoryNotificationRepository implements NotificationRepositoryPort {
	private readonly notifications = new Map<string, NotificationRecord>();

	async countUnread(recipientId: string): Promise<number> {
		return [...this.notifications.values()].filter(
			(notification) =>
				notification.recipientId === recipientId && !notification.readAt,
		).length;
	}

	async list(input: ListNotificationsInput): Promise<ListNotificationsOutput> {
		const items = [...this.notifications.values()]
			.filter((notification) => notification.recipientId === input.recipientId)
			.sort(
				(left, right) => right.activityAt.getTime() - left.activityAt.getTime(),
			);
		const page = items.slice(0, input.limit);

		return {
			items: page,
			nextCursor: items.length > input.limit ? (page.at(-1)?.id ?? null) : null,
			unreadCount: items.filter((notification) => !notification.readAt).length,
		};
	}

	async markRead(input: {
		notificationId: string;
		recipientId: string;
		readAt: Date;
		expectedActivityAt?: Date;
	}): Promise<NotificationRecord | 'changed' | null> {
		const notification = this.notifications.get(input.notificationId);
		if (!notification || notification.recipientId !== input.recipientId)
			return null;
		if (
			input.expectedActivityAt &&
			notification.activityAt.getTime() !== input.expectedActivityAt.getTime()
		)
			return 'changed';

		const updated = {
			...notification,
			readAt: notification.readAt ?? input.readAt,
		};
		this.notifications.set(updated.id, updated);
		return updated;
	}

	async markAllRead(input: {
		recipientId: string;
		readAt: Date;
		cutoffActivityAt: Date;
	}): Promise<number> {
		let count = 0;
		for (const notification of this.notifications.values()) {
			if (notification.recipientId !== input.recipientId || notification.readAt)
				continue;
			if (notification.activityAt > input.cutoffActivityAt) continue;

			this.notifications.set(notification.id, {
				...notification,
				readAt: input.readAt,
			});
			count++;
		}

		return count;
	}

	async upsert(input: UpsertNotificationInput): Promise<NotificationRecord> {
		const existing = [...this.notifications.values()].find(
			(notification) =>
				notification.recipientId === input.recipientId &&
				notification.type === input.type &&
				notification.aggregateKey === input.aggregateKey,
		);
		const now = new Date('2026-05-18T12:00:00.000Z');
		const notification: NotificationRecord = {
			id: existing?.id ?? `notification-${this.notifications.size + 1}`,
			recipientId: input.recipientId,
			type: input.type,
			aggregateKey: input.aggregateKey,
			payload: input.payload,
			readAt: null,
			createdAt: existing?.createdAt ?? now,
			activityAt: now,
			updatedAt: now,
		};
		this.notifications.set(notification.id, notification);
		return notification;
	}
}

class NotificationEventsSpy implements NotificationEventsPort {
	readonly updated: Array<{
		recipientId: string;
		notificationId: string;
		unreadCount: number;
	}> = [];
	readonly readAll: Array<{
		recipientId: string;
		cutoffActivityAt?: string;
		unreadCount: number;
	}> = [];

	emitNotificationUpdated(
		recipientId: string,
		event: { notification: { id: string }; unreadCount: number },
	): void {
		this.updated.push({
			recipientId,
			notificationId: event.notification.id,
			unreadCount: event.unreadCount,
		});
	}

	emitNotificationsReadAll(
		recipientId: string,
		event: { cutoffActivityAt?: string; unreadCount: number },
	): void {
		this.readAll.push({
			recipientId,
			cutoffActivityAt: event.cutoffActivityAt,
			unreadCount: event.unreadCount,
		});
	}
}

describe('notification use-cases', () => {
	it('coalesces chat notifications per recipient and order and emits recipient-scoped updates', async () => {
		const repository = new InMemoryNotificationRepository();
		const events = new NotificationEventsSpy();
		const useCase = new UpsertChatNotificationUseCase(repository, events);

		const first = await useCase.execute({
			recipientId: 'booster-1',
			orderId: 'order-1',
			chatMessageId: 'message-1',
			senderId: 'client-1',
			senderUsername: 'Client',
		});
		const second = await useCase.execute({
			recipientId: 'booster-1',
			orderId: 'order-1',
			chatMessageId: 'message-2',
			senderId: 'client-1',
			senderUsername: 'Client',
		});

		expect(second.id).toBe(first.id);
		expect(second.readAt).toBeNull();
		expect(second.payload.metadata.chatMessageId).toBe('message-2');
		expect(events.updated).toEqual([
			{ recipientId: 'booster-1', notificationId: first.id, unreadCount: 1 },
			{ recipientId: 'booster-1', notificationId: second.id, unreadCount: 1 },
		]);
	});

	it('lists only recipient-owned notifications with unread count', async () => {
		const repository = new InMemoryNotificationRepository();
		await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		await repository.upsert({
			recipientId: 'client-2',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-2',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-2',
					chatMessageId: 'message-2',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		const useCase = new ListNotificationsUseCase(repository);

		await expect(
			useCase.execute({ recipientId: 'client-1', limit: 10 }),
		).resolves.toMatchObject({
			items: [expect.objectContaining({ id: 'notification-1' })],
			nextCursor: null,
			unreadCount: 1,
		});
	});

	it('marks one owned notification read idempotently and hides foreign ids', async () => {
		const repository = new InMemoryNotificationRepository();
		const notification = await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		const events = new NotificationEventsSpy();
		const useCase = new MarkNotificationReadUseCase(repository, events);

		const first = await useCase.execute({
			notificationId: notification.id,
			recipientId: 'client-1',
			readAt: new Date('2026-05-18T12:00:00.000Z'),
		});
		const second = await useCase.execute({
			notificationId: notification.id,
			recipientId: 'client-1',
			readAt: new Date('2026-05-18T13:00:00.000Z'),
		});

		expect(second.readAt).toBe(first.readAt);
		expect(events.updated[0]).toMatchObject({ unreadCount: 0 });
		await expect(
			useCase.execute({
				notificationId: notification.id,
				recipientId: 'client-2',
				readAt: new Date('2026-05-18T14:00:00.000Z'),
				expectedActivityAt: new Date(notification.activityAt),
			}),
		).rejects.toThrow(NotificationNotFoundError);
	});

	it('rejects stale read attempts without clearing a newer notification', async () => {
		const repository = new InMemoryNotificationRepository();
		const notification = await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		const useCase = new MarkNotificationReadUseCase(
			repository,
			new NotificationEventsSpy(),
		);

		await expect(
			useCase.execute({
				notificationId: notification.id,
				recipientId: 'client-1',
				readAt: new Date('2026-05-18T13:00:00.000Z'),
				expectedActivityAt: new Date('2026-05-18T11:00:00.000Z'),
			}),
		).rejects.toThrow(NotificationReadConflictError);
	});

	it('marks all unread recipient notifications read idempotently', async () => {
		const repository = new InMemoryNotificationRepository();
		await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		const events = new NotificationEventsSpy();
		const useCase = new MarkAllNotificationsReadUseCase(repository, events);

		await expect(
			useCase.execute({
				recipientId: 'client-1',
				readAt: new Date('2026-05-18T12:00:00.000Z'),
			}),
		).resolves.toEqual({
			cutoffActivityAt: '2026-05-18T12:00:00.000Z',
			unreadCount: 0,
			updatedCount: 1,
		});
		await expect(
			useCase.execute({
				recipientId: 'client-1',
				readAt: new Date('2026-05-18T13:00:00.000Z'),
			}),
		).resolves.toEqual({
			cutoffActivityAt: '2026-05-18T13:00:00.000Z',
			unreadCount: 0,
			updatedCount: 0,
		});
		expect(events.readAll).toEqual([
			{
				recipientId: 'client-1',
				cutoffActivityAt: '2026-05-18T12:00:00.000Z',
				unreadCount: 0,
			},
			{
				recipientId: 'client-1',
				cutoffActivityAt: '2026-05-18T13:00:00.000Z',
				unreadCount: 0,
			},
		]);
	});

	it('emits the remaining unread count after a cutoff-limited bulk read', async () => {
		const repository = new InMemoryNotificationRepository();
		const oldNotification = await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		const newNotification = await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-2',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-2',
					chatMessageId: 'message-2',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
		});
		(
			repository as unknown as {
				notifications: Map<string, NotificationRecord>;
			}
		).notifications.set(newNotification.id, {
			...newNotification,
			activityAt: new Date('2026-05-18T13:00:00.000Z'),
		});
		await repository.markRead({
			notificationId: oldNotification.id,
			recipientId: 'client-1',
			readAt: new Date('2026-05-18T12:00:00.000Z'),
		});
		const events = new NotificationEventsSpy();
		const useCase = new MarkAllNotificationsReadUseCase(repository, events);

		await expect(
			useCase.execute({
				recipientId: 'client-1',
				readAt: new Date('2026-05-18T12:00:00.000Z'),
			}),
		).resolves.toEqual({
			cutoffActivityAt: '2026-05-18T12:00:00.000Z',
			unreadCount: 1,
			updatedCount: 0,
		});
		expect(events.readAll).toEqual([
			{
				recipientId: 'client-1',
				cutoffActivityAt: '2026-05-18T12:00:00.000Z',
				unreadCount: 1,
			},
		]);
		await expect(
			repository.markRead({
				notificationId: newNotification.id,
				recipientId: 'client-1',
				readAt: new Date('2026-05-18T13:00:00.000Z'),
			}),
		).resolves.toMatchObject({ readAt: new Date('2026-05-18T13:00:00.000Z') });
	});
});
