import type {
	ChatMessageRecord,
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
		return message;
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
	it('persists a client message for an in-progress participant order', async () => {
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
	});

	it('persists a booster message for an assigned in-progress order', async () => {
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
