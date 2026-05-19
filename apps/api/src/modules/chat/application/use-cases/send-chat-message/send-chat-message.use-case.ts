import {
	CHAT_REPOSITORY_KEY,
	type ChatRepositoryPort,
} from '@modules/chat/application/ports/chat-repository.port';
import {
	type ChatMessageResponse,
	mapChatMessageResponse,
} from '@modules/chat/application/use-cases/chat-response';
import {
	ChatForbiddenError,
	ChatNotWritableError,
	ChatOrderNotFoundError,
} from '@modules/chat/domain/chat.errors';
import {
	NOTIFICATION_EVENTS_KEY,
	type NotificationEventsPort,
} from '@modules/notifications/application/ports/notification-events.port';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type SendChatMessageInput = {
	orderId: string;
	userId: string;
	role: Role;
	content: string;
};

const WRITABLE_ORDER_STATUS = 'in_progress';

@Injectable()
export class SendChatMessageUseCase {
	constructor(
		@Inject(CHAT_REPOSITORY_KEY)
		private readonly chatRepository: ChatRepositoryPort,
		@Inject(NOTIFICATION_EVENTS_KEY)
		private readonly notificationEvents: NotificationEventsPort,
	) {}

	async execute(input: SendChatMessageInput): Promise<ChatMessageResponse> {
		const order = await this.chatRepository.findOrderChat(input.orderId);
		if (!order) throw new ChatOrderNotFoundError();
		if (!this.canWrite(input, order)) throw new ChatOrderNotFoundError();
		if (order.status !== WRITABLE_ORDER_STATUS)
			throw new ChatNotWritableError();
		if (!order.chatId) throw new ChatOrderNotFoundError();

		const recipientId = this.getRecipientId(input, order);
		const result = await this.chatRepository.createMessageWithNotification({
			chatId: order.chatId,
			senderId: input.userId,
			content: input.content,
			...(recipientId
				? {
						notification: {
							recipientId,
						},
					}
				: {}),
		});
		const { message } = result;
		if (recipientId && result.notification) {
			this.notificationEvents.emitNotificationUpdated(recipientId, {
				notification: result.notification.notification,
				unreadCount: result.notification.unreadCount,
			});
		}

		return mapChatMessageResponse(message);
	}

	private getRecipientId(
		input: Pick<SendChatMessageInput, 'role' | 'userId'>,
		order: {
			clientId: string | null;
			boosterId: string | null;
		},
	): string | null {
		if (input.role === Role.CLIENT && order.clientId === input.userId)
			return order.boosterId;
		if (input.role === Role.BOOSTER && order.boosterId === input.userId)
			return order.clientId;

		return null;
	}

	private canWrite(
		input: Pick<SendChatMessageInput, 'role' | 'userId'>,
		order: {
			clientId: string | null;
			boosterId: string | null;
		},
	): boolean {
		if (input.role === Role.ADMIN) throw new ChatForbiddenError();
		if (input.role === Role.CLIENT) return order.clientId === input.userId;
		if (input.role === Role.BOOSTER) return order.boosterId === input.userId;

		throw new ChatForbiddenError();
	}
}
