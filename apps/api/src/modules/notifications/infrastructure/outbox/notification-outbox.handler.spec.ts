import type { OutboxEventRecord } from '@app/common/outbox/outbox-event';
import { OutboxHandlerRegistry } from '@app/common/outbox/outbox-event-handler';
import type { NotificationEventsPort } from '@modules/notifications/application/ports/notification-events.port';
import { NotificationOutboxHandler } from '@modules/notifications/infrastructure/outbox/notification-outbox.handler';

class NotificationEventsSpy implements NotificationEventsPort {
	readonly updated: Array<{ recipientId: string; event: unknown }> = [];
	readonly readAll: Array<{ recipientId: string; event: unknown }> = [];

	emitNotificationUpdated(recipientId: string, event: unknown): void {
		this.updated.push({ recipientId, event });
	}

	emitNotificationsReadAll(recipientId: string, event: unknown): void {
		this.readAll.push({ recipientId, event });
	}
}

const makeRecord = (
	overrides: Partial<OutboxEventRecord> = {},
): OutboxEventRecord => ({
	id: 'evt-1',
	aggregateType: 'notification',
	aggregateId: 'user-1',
	eventType: 'notification.updated',
	payload: {},
	status: 'PENDING',
	attempts: 0,
	availableAt: new Date('2026-06-12T00:00:00.000Z'),
	publishedAt: null,
	lastError: null,
	createdAt: new Date('2026-06-12T00:00:00.000Z'),
	updatedAt: new Date('2026-06-12T00:00:00.000Z'),
	...overrides,
});

const updatedEvent = {
	notification: {
		id: 'notification-1',
		type: 'CHAT_MESSAGE_CREATED' as const,
		payload: {
			type: 'CHAT_MESSAGE_CREATED' as const,
			metadata: {
				orderId: 'order-1',
				chatMessageId: 'message-1',
				senderId: 'client-1',
				senderUsername: 'Client',
			},
		},
		readAt: null,
		activityAt: '2026-06-12T00:00:00.000Z',
		createdAt: '2026-06-12T00:00:00.000Z',
		updatedAt: '2026-06-12T00:00:00.000Z',
	},
	unreadCount: 2,
};

describe('NotificationOutboxHandler', () => {
	it('registers itself for both notification event types on bootstrap', () => {
		const registry = new OutboxHandlerRegistry();
		const handler = new NotificationOutboxHandler(
			new NotificationEventsSpy(),
			registry,
		);

		handler.onApplicationBootstrap();

		expect(registry.resolve('notification.updated')).toBe(handler);
		expect(registry.resolve('notification.read-all')).toBe(handler);
	});

	it('emits a notification updated event from the outbox payload', () => {
		const events = new NotificationEventsSpy();
		const handler = new NotificationOutboxHandler(
			events,
			new OutboxHandlerRegistry(),
		);

		handler.handle(
			makeRecord({
				eventType: 'notification.updated',
				payload: { recipientId: 'user-1', event: updatedEvent },
			}),
		);

		expect(events.updated).toEqual([
			{ recipientId: 'user-1', event: updatedEvent },
		]);
		expect(events.readAll).toEqual([]);
	});

	it('emits a read-all event from the outbox payload', () => {
		const events = new NotificationEventsSpy();
		const handler = new NotificationOutboxHandler(
			events,
			new OutboxHandlerRegistry(),
		);
		const readAllEvent = {
			readAt: '2026-06-12T00:00:00.000Z',
			cutoffActivityAt: '2026-06-12T00:00:00.000Z',
			unreadCount: 0,
		};

		handler.handle(
			makeRecord({
				eventType: 'notification.read-all',
				payload: { recipientId: 'user-1', event: readAllEvent },
			}),
		);

		expect(events.readAll).toEqual([
			{ recipientId: 'user-1', event: readAllEvent },
		]);
		expect(events.updated).toEqual([]);
	});

	it('throws on a malformed payload so the dispatcher can retry', () => {
		const handler = new NotificationOutboxHandler(
			new NotificationEventsSpy(),
			new OutboxHandlerRegistry(),
		);

		expect(() =>
			handler.handle(
				makeRecord({
					eventType: 'notification.updated',
					payload: { recipientId: 'user-1' },
				}),
			),
		).toThrow();
	});
});
