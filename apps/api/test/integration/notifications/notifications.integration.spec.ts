import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import type { NotificationEventsPort } from '@modules/notifications/application/ports/notification-events.port';
import { NOTIFICATION_EVENTS_KEY } from '@modules/notifications/application/ports/notification-events.port';
import type {
	ListNotificationsInput,
	ListNotificationsOutput,
	NotificationRecord,
	NotificationRepositoryPort,
	UpsertNotificationInput,
} from '@modules/notifications/application/ports/notification-repository.port';
import { NOTIFICATION_REPOSITORY_KEY } from '@modules/notifications/application/ports/notification-repository.port';
import { NotificationNotFoundError } from '@modules/notifications/domain/notification.errors';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { NotificationsController } from '@modules/notifications/presentation/notifications.controller';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';

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
		let updatedCount = 0;
		for (const notification of this.notifications.values()) {
			if (
				notification.recipientId !== input.recipientId ||
				notification.readAt ||
				notification.activityAt > input.cutoffActivityAt
			)
				continue;

			this.notifications.set(notification.id, {
				...notification,
				readAt: input.readAt,
			});
			updatedCount++;
		}

		return updatedCount;
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
			activityAt: now,
			createdAt: existing?.createdAt ?? now,
			updatedAt: now,
		};
		this.notifications.set(notification.id, notification);
		return notification;
	}
}

class NotificationEventsSpy implements NotificationEventsPort {
	readonly updated: unknown[] = [];
	readonly readAll: Array<{ recipientId: string; unreadCount: number }> = [];

	emitNotificationUpdated(_recipientId: string, event: unknown): void {
		this.updated.push(event);
	}

	emitNotificationsReadAll(
		recipientId: string,
		event: { unreadCount: number },
	): void {
		this.readAll.push({ recipientId, unreadCount: event.unreadCount });
	}
}

const makePayload = (orderId: string, chatMessageId: string) => ({
	type: 'CHAT_MESSAGE_CREATED' as const,
	metadata: {
		orderId,
		chatMessageId,
		senderId: 'booster-1',
		senderUsername: 'Booster',
	},
});

describe('Notifications module integration', () => {
	let controller: NotificationsController;
	let events: NotificationEventsSpy;
	let moduleRef: TestingModule;
	let repository: InMemoryNotificationRepository;
	const clientUser: AuthenticatedUser = { id: 'client-1', role: Role.CLIENT };
	const otherClientUser: AuthenticatedUser = {
		id: 'client-2',
		role: Role.CLIENT,
	};

	beforeEach(async () => {
		events = new NotificationEventsSpy();
		repository = new InMemoryNotificationRepository();
		moduleRef = await Test.createTestingModule({
			imports: [NotificationsModule],
		})
			.overrideProvider(NOTIFICATION_REPOSITORY_KEY)
			.useValue(repository)
			.overrideProvider(NOTIFICATION_EVENTS_KEY)
			.useValue(events)
			.compile();
		controller = moduleRef.get(NotificationsController);
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('lists only notifications owned by the authenticated recipient', async () => {
		await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: makePayload('order-1', 'message-1'),
		});
		await repository.upsert({
			recipientId: 'client-2',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-2',
			payload: makePayload('order-2', 'message-2'),
		});

		await expect(
			controller.list({ limit: 10 }, clientUser),
		).resolves.toMatchObject({
			items: [expect.objectContaining({ id: 'notification-1' })],
			unreadCount: 1,
		});
	});

	it('hides foreign notification ids when marking one read', async () => {
		const notification = await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: makePayload('order-1', 'message-1'),
		});

		await expect(
			controller.markRead(
				notification.id,
				{ expectedActivityAt: notification.activityAt.toISOString() },
				otherClientUser,
			),
		).rejects.toThrow(NotificationNotFoundError);
	});

	it('marks all owned notifications read and emits the remaining unread count', async () => {
		await repository.upsert({
			recipientId: 'client-1',
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: 'order-1',
			payload: makePayload('order-1', 'message-1'),
		});

		await expect(controller.markAllRead(clientUser)).resolves.toMatchObject({
			unreadCount: 0,
			updatedCount: 1,
		});
		expect(events.readAll).toEqual([
			{ recipientId: 'client-1', unreadCount: 0 },
		]);
	});
});
