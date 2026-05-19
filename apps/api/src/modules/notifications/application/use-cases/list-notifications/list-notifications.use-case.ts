import {
	NOTIFICATION_REPOSITORY_KEY,
	type NotificationRepositoryPort,
} from '@modules/notifications/application/ports/notification-repository.port';
import { mapListNotificationsResponse } from '@modules/notifications/application/use-cases/notification-response';
import { Inject, Injectable } from '@nestjs/common';
import type { ListNotificationsResponse } from '@packages/shared/notifications/notification.schema';

type ListNotificationsInput = {
	recipientId: string;
	limit: number;
	cursor?: string;
};

@Injectable()
export class ListNotificationsUseCase {
	constructor(
		@Inject(NOTIFICATION_REPOSITORY_KEY)
		private readonly notificationRepository: NotificationRepositoryPort,
	) {}

	async execute(
		input: ListNotificationsInput,
	): Promise<ListNotificationsResponse> {
		return mapListNotificationsResponse(
			await this.notificationRepository.list(input),
		);
	}
}
