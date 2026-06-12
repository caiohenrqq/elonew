import {
	NOTIFICATION_REPOSITORY_KEY,
	type NotificationRepositoryPort,
} from '@modules/notifications/application/ports/notification-repository.port';
import {
	mapNotificationResponse,
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
	) {}

	async execute(
		input: MarkNotificationReadInput,
	): Promise<NotificationResponse> {
		const notification = await this.notificationRepository.markRead(input);
		if (notification === 'changed') throw new NotificationReadConflictError();
		if (!notification) throw new NotificationNotFoundError();

		return mapNotificationResponse(notification);
	}
}
