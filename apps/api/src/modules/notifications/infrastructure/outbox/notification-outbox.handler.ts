import type { OutboxEventRecord } from '@app/common/outbox/outbox-event';
import {
	type OutboxEventHandler,
	OutboxHandlerRegistry,
} from '@app/common/outbox/outbox-event-handler';
import {
	NOTIFICATION_EVENTS_KEY,
	type NotificationEventsPort,
} from '@modules/notifications/application/ports/notification-events.port';
import {
	Inject,
	Injectable,
	type OnApplicationBootstrap,
} from '@nestjs/common';
import {
	NOTIFICATION_READ_ALL_EVENT,
	NOTIFICATION_UPDATED_EVENT,
	notificationReadAllOutboxPayloadSchema,
	notificationUpdatedOutboxPayloadSchema,
} from './notification-outbox.events';

@Injectable()
export class NotificationOutboxHandler
	implements OutboxEventHandler, OnApplicationBootstrap
{
	readonly eventTypes = [
		NOTIFICATION_UPDATED_EVENT,
		NOTIFICATION_READ_ALL_EVENT,
	];

	constructor(
		@Inject(NOTIFICATION_EVENTS_KEY)
		private readonly notificationEvents: NotificationEventsPort,
		private readonly registry: OutboxHandlerRegistry,
	) {}

	onApplicationBootstrap(): void {
		this.registry.register(this);
	}

	handle(event: OutboxEventRecord): void {
		if (event.eventType === NOTIFICATION_UPDATED_EVENT) {
			const payload = notificationUpdatedOutboxPayloadSchema.parse(
				event.payload,
			);
			this.notificationEvents.emitNotificationUpdated(
				payload.recipientId,
				payload.event,
			);
			return;
		}

		if (event.eventType === NOTIFICATION_READ_ALL_EVENT) {
			const payload = notificationReadAllOutboxPayloadSchema.parse(
				event.payload,
			);
			this.notificationEvents.emitNotificationsReadAll(
				payload.recipientId,
				payload.event,
			);
		}
	}
}
