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
import { Inject, Injectable } from '@nestjs/common';

type UpsertChatNotificationInput = {
	recipientId: string;
	orderId: string;
	chatMessageId: string;
	senderId: string;
	senderUsername: string;
};

@Injectable()
export class UpsertChatNotificationUseCase {
	constructor(
		@Inject(NOTIFICATION_REPOSITORY_KEY)
		private readonly notificationRepository: NotificationRepositoryPort,
		@Inject(NOTIFICATION_EVENTS_KEY)
		private readonly notificationEvents: NotificationEventsPort,
	) {}

	async execute(
		input: UpsertChatNotificationInput,
	): Promise<NotificationResponse> {
		const notificationRecord = await this.notificationRepository.upsert({
			recipientId: input.recipientId,
			type: 'CHAT_MESSAGE_CREATED',
			aggregateKey: input.orderId,
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: input.orderId,
					chatMessageId: input.chatMessageId,
					senderId: input.senderId,
					senderUsername: input.senderUsername,
				},
			},
		});
		const unreadCount = await this.notificationRepository.countUnread(
			input.recipientId,
		);
		const notification = mapNotificationResponse(notificationRecord);

		this.notificationEvents.emitNotificationUpdated(
			input.recipientId,
			mapNotificationUpdatedEventResponse(notificationRecord, unreadCount),
		);

		return notification;
	}
}
