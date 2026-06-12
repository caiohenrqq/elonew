import {
	NOTIFICATION_REPOSITORY_KEY,
	type NotificationRepositoryPort,
} from '@modules/notifications/application/ports/notification-repository.port';
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
	) {}

	async execute(
		input: MarkAllNotificationsReadInput,
	): Promise<MarkAllNotificationsReadResponse> {
		const cutoffActivityAt = input.readAt;
		const { updatedCount, unreadCount } =
			await this.notificationRepository.markAllRead({
				...input,
				cutoffActivityAt,
			});

		return {
			cutoffActivityAt: cutoffActivityAt.toISOString(),
			unreadCount,
			updatedCount,
		};
	}
}
