import {
	NOTIFICATION_EVENTS_KEY,
	type NotificationEventsPort,
} from '@modules/notifications/application/ports/notification-events.port';
import {
	NOTIFICATION_REPOSITORY_KEY,
	type NotificationRepositoryPort,
} from '@modules/notifications/application/ports/notification-repository.port';
import { mapNotificationsReadAllEventResponse } from '@modules/notifications/application/use-cases/notification-response';
import { Inject, Injectable } from '@nestjs/common';
import type { MarkAllNotificationsReadResponse } from '@packages/shared/notifications/notification.schema';

type MarkAllNotificationsReadInput = {
	recipientId: string;
	readAt: Date;
};

@Injectable()
export class MarkAllNotificationsReadUseCase {
	constructor(
		@Inject(NOTIFICATION_REPOSITORY_KEY)
		private readonly notificationRepository: NotificationRepositoryPort,
		@Inject(NOTIFICATION_EVENTS_KEY)
		private readonly notificationEvents: NotificationEventsPort,
	) {}

	async execute(
		input: MarkAllNotificationsReadInput,
	): Promise<MarkAllNotificationsReadResponse> {
		const cutoffActivityAt = input.readAt;
		const updatedCount = await this.notificationRepository.markAllRead({
			...input,
			cutoffActivityAt,
		});
		const unreadCount = await this.notificationRepository.countUnread(
			input.recipientId,
		);
		void this.notificationEvents.emitNotificationsReadAll(
			input.recipientId,
			mapNotificationsReadAllEventResponse(
				input.readAt,
				cutoffActivityAt,
				unreadCount,
			),
		);

		return {
			cutoffActivityAt: cutoffActivityAt.toISOString(),
			unreadCount,
			updatedCount,
		};
	}
}
