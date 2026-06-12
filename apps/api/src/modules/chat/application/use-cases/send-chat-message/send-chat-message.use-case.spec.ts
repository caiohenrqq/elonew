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
import { Role } from '@packages/auth/roles/role';

class InMemoryChatRepository implements ChatRepositoryPort {
	order: ChatOrderRecord | null = null;
	readonly messages: ChatMessageRecord[] = [];
	failNotificationPersistence = false;
	notificationRequested = false;
	lastNotificationRecipientId: string | null = null;

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
		this.notificationRequested = Boolean(input.notification);
		this.lastNotificationRecipientId = input.notification?.recipientId ?? null;
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

const makeWritableOrder = (): ChatOrderRecord => ({
	orderId: 'order-1',
	clientId: 'client-1',
	boosterId: 'booster-1',
	status: 'in_progress',
	chatId: 'chat-1',
});

describe('SendChatMessageUseCase', () => {
	it('persists a client message and requests a notification for the booster', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		const useCase = new SendChatMessageUseCase(repository);

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
		expect(repository.lastNotificationRecipientId).toBe('booster-1');
	});

	it('persists a booster message and requests a notification for the client', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		const useCase = new SendChatMessageUseCase(repository);

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
		expect(repository.lastNotificationRecipientId).toBe('client-1');
	});

	it('does not request a notification when the opposite participant is missing', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = {
			...makeWritableOrder(),
			boosterId: null,
		};
		const useCase = new SendChatMessageUseCase(repository);

		await useCase.execute({
			orderId: 'order-1',
			userId: 'client-1',
			role: Role.CLIENT,
			content: 'sem booster',
		});

		expect(repository.notificationRequested).toBe(false);
		expect(repository.lastNotificationRecipientId).toBeNull();
	});

	it('does not leave a persisted message when notification persistence fails', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeWritableOrder();
		repository.failNotificationPersistence = true;
		const useCase = new SendChatMessageUseCase(repository);

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
		const useCase = new SendChatMessageUseCase(repository);

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
		const useCase = new SendChatMessageUseCase(repository);

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
		const useCase = new SendChatMessageUseCase(repository);

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
