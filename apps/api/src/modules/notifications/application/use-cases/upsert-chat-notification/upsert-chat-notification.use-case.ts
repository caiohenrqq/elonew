import {
	NOTIFICATION_REPOSITORY_KEY,
	type NotificationRepositoryPort,
} from '@modules/notifications/application/ports/notification-repository.port';
import {
	mapNotificationResponse,
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

		return mapNotificationResponse(notificationRecord);
	}
}
