import type {
	ChatMessageRecord,
	ChatMessageWriteResult,
	ChatOrderRecord,
	ChatRepositoryPort,
	ListChatMessagesInput,
	ListChatMessagesOutput,
} from '@modules/chat/application/ports/chat-repository.port';
import { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
import {
	ChatForbiddenError,
	ChatNotWritableError,
	ChatOrderNotFoundError,
} from '@modules/chat/domain/chat.errors';
import type { NotificationEventsPort } from '@modules/notifications/application/ports/notification-events.port';
import { Role } from '@packages/auth/roles/role';

class InMemoryChatRepository implements ChatRepositoryPort {
	order: ChatOrderRecord | null = null;
	readonly messages: ChatMessageRecord[] = [];
	failNotificationPersistence = false;

	async findOrderChat(_orderId: string): Promise<ChatOrderRecord | null> {
		return this.order;
	}

	async createOrderChat(
		orderId: string,
	): Promise<{ id: string; orderId: string }> {
		this.order = {
			orderId,
			clientId: 'client-1',
			boosterId: 'booster-1',
			status: 'in_progress',
			chatId: 'chat-1',
		};
		return { id: 'chat-1', orderId };
	}

	async createMessage(input: {
		chatId: string;
		senderId: string;
		content: string;
	}): Promise<ChatMessageRecord> {
		return (await this.createMessageWithNotification(input)).message;
	}

	async createMessageWithNotification(input: {
		chatId: string;
		senderId: string;
		content: string;
		notification?: { recipientId: string };
	}): Promise<ChatMessageWriteResult> {
		if (input.notification && this.failNotificationPersistence)
			throw new Error('notification persistence failed');

		const message: ChatMessageRecord = {
			id: `message-${this.messages.length + 1}`,
			orderId: this.order?.orderId ?? 'order-1',
			chatId: input.chatId,
			content: input.content,
			sender: {
				id: input.senderId,
				username: 'sender',
				role: Role.CLIENT,
			},
			createdAt: new Date('2026-05-08T12:00:00.000Z'),
		};
		this.messages.push(message);
		return {
			message,
			...(input.notification
				? {
						notification: {
							notification: {
								id: `notification-${message.id}`,
								type: 'CHAT_MESSAGE_CREATED' as const,
								payload: {
									type: 'CHAT_MESSAGE_CREATED' as const,
									metadata: {
										orderId: message.orderId,
										chatMessageId: message.id,
										senderId: message.sender.id,
										senderUsername: message.sender.username,
									},
								},
								readAt: null,
								activityAt: message.createdAt.toISOString(),
								createdAt: message.createdAt.toISOString(),
								updatedAt: message.createdAt.toISOString(),
							},
							unreadCount: 1,
						},
					}
				: {}),
		};
	}

	async listMessages(
		_input: ListChatMessagesInput,
	): Promise<ListChatMessagesOutput> {
		return { items: this.messages, nextCursor: null };
	}
}

type NotificationUpdatedSpyEvent = {
	notification: { id: string };
	unreadCount: number;
};

type NotificationsReadAllSpyEvent = {
	unreadCount: number;
};

class NotificationEventsSpy implements NotificationEventsPort {
	readonly updated: Array<{
		recipientId: string;
		notificationId: string;
		unreadCount: number;
	}> = [];
	readonly readAll: Array<{ recipientId: string; unreadCount: number }> = [];

	emitNotificationUpdated(
		recipientId: string,
		event: NotificationUpdatedSpyEvent,
	): void {
		this.updated.push({
			recipientId,
			notificationId: event.notification.id,
			unreadCount: event.unreadCount,
		});
	}

	emitNotificationsReadAll(
		recipientId: string,
		event: NotificationsReadAllSpyEvent,
	): void {
		this.readAll.push({ recipientId, unreadCount: event.unreadCount });
	}
}

const makeWritableOrder = (): ChatOrderRecord => ({
	orderId: 'order-1',
	clientId: 'client-1',
	boosterId: 'booster-1',
	status: 'in_progress',
	chatId: 'chat-1',
});

describe('SendChatMessageUseCase', () => {
	it('persists a client message for an in-progress participant order', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		const notifications = new NotificationEventsSpy();
		const useCase = new SendChatMessageUseCase(repository, notifications);

		const message = await useCase.execute({
			orderId: 'order-1',
			userId: 'client-1',
			role: Role.CLIENT,
			content: 'Olá booster',
		});

		expect(message).toMatchObject({
			orderId: 'order-1',
			chatId: 'chat-1',
			content: 'Olá booster',
		});
		expect(notifications.updated).toEqual([
			{
				recipientId: 'booster-1',
				notificationId: 'notification-message-1',
				unreadCount: 1,
			},
		]);
	});

	it('persists a booster message for an assigned in-progress order', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		const notifications = new NotificationEventsSpy();
		const useCase = new SendChatMessageUseCase(repository, notifications);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'booster-1',
				role: Role.BOOSTER,
				content: 'Começando agora',
			}),
		).resolves.toMatchObject({
			content: 'Começando agora',
		});
		expect(notifications.updated).toEqual([
			expect.objectContaining({
				recipientId: 'client-1',
			}),
		]);
	});

	it('does not create a notification when the opposite participant is missing', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = {
			...makeWritableOrder(),
			boosterId: null,
		};
		const notifications = new NotificationEventsSpy();
		const useCase = new SendChatMessageUseCase(repository, notifications);

		await useCase.execute({
			orderId: 'order-1',
			userId: 'client-1',
			role: Role.CLIENT,
			content: 'sem booster',
		});

		expect(notifications.updated).toEqual([]);
	});

	it('does not leave a persisted message when notification persistence fails', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		repository.failNotificationPersistence = true;
		const useCase = new SendChatMessageUseCase(
			repository,
			new NotificationEventsSpy(),
		);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'client-1',
				role: Role.CLIENT,
				content: 'Olá booster',
			}),
		).rejects.toThrow('notification persistence failed');
		expect(repository.messages).toEqual([]);
	});

	it('hides orders from unrelated participants', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		const useCase = new SendChatMessageUseCase(
			repository,
			new NotificationEventsSpy(),
		);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'client-2',
				role: Role.CLIENT,
				content: 'invadir',
			}),
		).rejects.toThrow(ChatOrderNotFoundError);
	});

	it('rejects admin writes', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		const useCase = new SendChatMessageUseCase(
			repository,
			new NotificationEventsSpy(),
		);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'admin-1',
				role: Role.ADMIN,
				content: 'moderação',
			}),
		).rejects.toThrow(ChatForbiddenError);
	});

	it('rejects messages outside in-progress orders', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = {
			...makeWritableOrder(),
			status: 'completed',
		};
		const useCase = new SendChatMessageUseCase(
			repository,
			new NotificationEventsSpy(),
		);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'client-1',
				role: Role.CLIENT,
				content: 'depois',
			}),
		).rejects.toThrow(ChatNotWritableError);
	});
});
