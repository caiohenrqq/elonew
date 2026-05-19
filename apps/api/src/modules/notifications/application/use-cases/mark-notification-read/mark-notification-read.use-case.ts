import {
	NOTIFICATION_EVENTS_KEY,
	type NotificationEventsPort,
} from '@modules/notifications/application/ports/notification-events.port';
import {
	NOTIFICATION_REPOSITORY_KEY,
	type NotificationRepositoryPort,
} from '@modules/notifications/application/ports/notification-repository.port';
import {
	mapNotificationResponse,
	mapNotificationUpdatedEventResponse,
	type NotificationResponse,
} from '@modules/notifications/application/use-cases/notification-response';
import {
	NotificationNotFoundError,
	NotificationReadConflictError,
} from '@modules/notifications/domain/notification.errors';
import { Inject, Injectable } from '@nestjs/common';

type MarkNotificationReadInput = {
	notificationId: string;
	recipientId: string;
	readAt: Date;
	expectedActivityAt?: Date;
};

@Injectable()
export class MarkNotificationReadUseCase {
	constructor(
		@Inject(NOTIFICATION_REPOSITORY_KEY)
		private readonly notificationRepository: NotificationRepositoryPort,
		@Inject(NOTIFICATION_EVENTS_KEY)
		private readonly notificationEvents: NotificationEventsPort,
	) {}

	async execute(
		input: MarkNotificationReadInput,
	): Promise<NotificationResponse> {
		const notification = await this.notificationRepository.markRead(input);
		if (notification === 'changed') throw new NotificationReadConflictError();
		if (!notification) throw new NotificationNotFoundError();

		const unreadCount = await this.notificationRepository.countUnread(
			input.recipientId,
		);
		this.notificationEvents.emitNotificationUpdated(
			input.recipientId,
			mapNotificationUpdatedEventResponse(notification, unreadCount),
		);

		return mapNotificationResponse(notification);
	}
}
