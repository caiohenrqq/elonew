import type {
	ChatMessageRecord,
	ChatOrderRecord,
	ChatRepositoryPort,
	ListChatMessagesInput,
	ListChatMessagesOutput,
} from '@modules/chat/application/ports/chat-repository.port';
import { ChatMessageNotFoundError } from '@modules/chat/domain/chat.errors';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Role } from '@packages/auth/roles/role';

export class InMemoryChatRepository implements ChatRepositoryPort {
	private readonly chatIdByOrderId = new Map<string, string>();
	private readonly messages = new Map<string, ChatMessageRecord[]>();
	private nextChatId = 1;
	private nextMessageId = 1;

	constructor(private readonly orderRepository: OrderRepositoryPort) {}

	async findOrderChat(orderId: string): Promise<ChatOrderRecord | null> {
		const order = await this.orderRepository.findById(orderId);
		if (!order) return null;

		return {
			orderId: order.id,
			clientId: order.clientId,
			boosterId: order.boosterId,
			status: order.status,
			chatId: this.chatIdByOrderId.get(orderId) ?? null,
		};
	}

	async createOrderChat(
		orderId: string,
	): Promise<{ id: string; orderId: string }> {
		const existingChatId = this.chatIdByOrderId.get(orderId);
		if (existingChatId) return { id: existingChatId, orderId };

		const chatId = `chat-${this.nextChatId++}`;
		this.chatIdByOrderId.set(orderId, chatId);
		this.messages.set(chatId, []);

		return { id: chatId, orderId };
	}

	async createMessage(input: {
		chatId: string;
		senderId: string;
		content: string;
	}): Promise<ChatMessageRecord> {
		const orderId = this.getOrderIdForChat(input.chatId);
		const message: ChatMessageRecord = {
			id: `message-${this.nextMessageId++}`,
			orderId,
			chatId: input.chatId,
			content: input.content,
			sender: {
				id: input.senderId,
				username: input.senderId,
				role: this.inferRole(input.senderId),
			},
			createdAt: new Date(Date.UTC(2026, 4, 8, 12, 0, this.nextMessageId)),
		};

		this.messages.set(input.chatId, [
			...(this.messages.get(input.chatId) ?? []),
			message,
		]);

		return message;
	}

	async listMessages(
		input: ListChatMessagesInput,
	): Promise<ListChatMessagesOutput> {
		const messages = [...(this.messages.get(input.chatId) ?? [])].sort(
			(left, right) =>
				right.createdAt.getTime() - left.createdAt.getTime() ||
				right.id.localeCompare(left.id),
		);
		const startIndex = input.cursor
			? messages.findIndex((message) => message.id === input.cursor)
			: -1;
		if (input.cursor && startIndex === -1) throw new ChatMessageNotFoundError();

		const pageStart = input.cursor ? startIndex + 1 : 0;
		const page = messages.slice(pageStart, pageStart + input.limit + 1);
		const items = page.slice(0, input.limit);

		return {
			items: items.reverse(),
			nextCursor:
				page.length > input.limit
					? (items[items.length - 1]?.id ?? null)
					: null,
		};
	}

	private getOrderIdForChat(chatId: string): string {
		for (const [orderId, existingChatId] of this.chatIdByOrderId.entries()) {
			if (existingChatId === chatId) return orderId;
		}

		throw new ChatMessageNotFoundError();
	}

	private inferRole(userId: string): Role {
		if (userId.startsWith('admin')) return Role.ADMIN;
		if (userId.startsWith('booster')) return Role.BOOSTER;
		return Role.CLIENT;
	}
}
