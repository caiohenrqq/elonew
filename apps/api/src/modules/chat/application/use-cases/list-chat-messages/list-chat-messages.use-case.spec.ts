import type {
	ChatMessageRecord,
	ChatOrderRecord,
	ChatRepositoryPort,
	ListChatMessagesInput,
	ListChatMessagesOutput,
} from '@modules/chat/application/ports/chat-repository.port';
import { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import { ChatOrderNotFoundError } from '@modules/chat/domain/chat.errors';
import { Role } from '@packages/auth/roles/role';

class InMemoryChatRepository implements ChatRepositoryPort {
	order: ChatOrderRecord | null = null;
	messages: ChatMessageRecord[] = [];
	lastListInput: ListChatMessagesInput | null = null;

	async findOrderChat(_orderId: string): Promise<ChatOrderRecord | null> {
		return this.order;
	}

	async createOrderChat(
		orderId: string,
	): Promise<{ id: string; orderId: string }> {
		return { id: 'chat-1', orderId };
	}

	async createMessage(_input: {
		chatId: string;
		senderId: string;
		content: string;
	}): Promise<ChatMessageRecord> {
		throw new Error('Not implemented.');
	}

	async listMessages(
		input: ListChatMessagesInput,
	): Promise<ListChatMessagesOutput> {
		this.lastListInput = input;
		return { items: this.messages, nextCursor: 'message-1' };
	}
}

const makeOrder = (): ChatOrderRecord => ({
	orderId: 'order-1',
	clientId: 'client-1',
	boosterId: 'booster-1',
	status: 'completed',
	chatId: 'chat-1',
});

const makeMessage = (): ChatMessageRecord => ({
	id: 'message-1',
	orderId: 'order-1',
	chatId: 'chat-1',
	content: 'Histórico',
	sender: {
		id: 'client-1',
		username: 'client',
		role: Role.CLIENT,
	},
	createdAt: new Date('2026-05-08T12:00:00.000Z'),
});

describe('ListChatMessagesUseCase', () => {
	it('allows the client participant to read history after completion', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeOrder();
		repository.messages = [makeMessage()];
		const useCase = new ListChatMessagesUseCase(repository);

		const result = await useCase.execute({
			orderId: 'order-1',
			userId: 'client-1',
			role: Role.CLIENT,
			limit: 50,
		});

		expect(result.items).toMatchObject([{ content: 'Histórico' }]);
		expect(result.nextCursor).toBe('message-1');
	});

	it('allows admins to read chat history', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeOrder();
		repository.messages = [makeMessage()];
		const useCase = new ListChatMessagesUseCase(repository);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'admin-1',
				role: Role.ADMIN,
				limit: 50,
			}),
		).resolves.toMatchObject({
			items: [{ content: 'Histórico' }],
		});
	});

	it('hides chat history from unrelated users', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = makeOrder();
		const useCase = new ListChatMessagesUseCase(repository);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'booster-2',
				role: Role.BOOSTER,
				limit: 50,
			}),
		).rejects.toThrow(ChatOrderNotFoundError);
	});

	it('returns empty history when an authorized order has no chat yet', async () => {
		const repository = new InMemoryChatRepository();
		repository.order = {
			...makeOrder(),
			chatId: null,
		};
		const useCase = new ListChatMessagesUseCase(repository);

		await expect(
			useCase.execute({
				orderId: 'order-1',
				userId: 'client-1',
				role: Role.CLIENT,
				limit: 50,
			}),
		).resolves.toEqual({ items: [], nextCursor: null });
	});
});
