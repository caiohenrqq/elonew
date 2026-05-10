import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	ChatMessageRecord,
	ChatOrderRecord,
	ChatRepositoryPort,
	ListChatMessagesInput,
	ListChatMessagesOutput,
} from '@modules/chat/application/ports/chat-repository.port';
import { ChatMessageNotFoundError } from '@modules/chat/domain/chat.errors';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

@Injectable()
export class PrismaChatRepository implements ChatRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findOrderChat(orderId: string): Promise<ChatOrderRecord | null> {
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			select: {
				id: true,
				clientId: true,
				boosterId: true,
				status: true,
				chat: {
					select: {
						id: true,
					},
				},
			},
		});
		if (!order) return null;

		return {
			orderId: order.id,
			clientId: order.clientId,
			boosterId: order.boosterId,
			status: order.status,
			chatId: order.chat?.id ?? null,
		};
	}

	async createOrderChat(
		orderId: string,
	): Promise<{ id: string; orderId: string }> {
		return await this.prisma.chat.upsert({
			where: { orderId },
			create: { orderId },
			update: {},
			select: {
				id: true,
				orderId: true,
			},
		});
	}

	async createMessage(input: {
		chatId: string;
		senderId: string;
		content: string;
	}): Promise<ChatMessageRecord> {
		const message = await this.prisma.chatMessage.create({
			data: {
				chatId: input.chatId,
				senderId: input.senderId,
				content: input.content,
			},
			include: {
				chat: {
					select: {
						orderId: true,
					},
				},
				sender: {
					select: {
						id: true,
						username: true,
						role: true,
					},
				},
			},
		});

		return this.mapMessage(message);
	}

	async listMessages(
		input: ListChatMessagesInput,
	): Promise<ListChatMessagesOutput> {
		if (input.cursor) {
			const cursorMessage = await this.prisma.chatMessage.findFirst({
				where: {
					id: input.cursor,
					chatId: input.chatId,
				},
				select: { id: true },
			});
			if (!cursorMessage) throw new ChatMessageNotFoundError();
		}

		const messages = await this.prisma.chatMessage.findMany({
			where: { chatId: input.chatId },
			cursor: input.cursor ? { id: input.cursor } : undefined,
			skip: input.cursor ? 1 : 0,
			take: input.limit + 1,
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			include: {
				chat: {
					select: {
						orderId: true,
					},
				},
				sender: {
					select: {
						id: true,
						username: true,
						role: true,
					},
				},
			},
		});

		const page = messages.slice(0, input.limit);

		return {
			items: page.map((message) => this.mapMessage(message)).reverse(),
			nextCursor:
				messages.length > input.limit
					? (page[page.length - 1]?.id ?? null)
					: null,
		};
	}

	private mapMessage(message: {
		id: string;
		chatId: string;
		content: string;
		createdAt: Date;
		chat: {
			orderId: string;
		};
		sender: {
			id: string;
			username: string;
			role: string;
		};
	}): ChatMessageRecord {
		return {
			id: message.id,
			orderId: message.chat.orderId,
			chatId: message.chatId,
			content: message.content,
			sender: {
				id: message.sender.id,
				username: message.sender.username,
				role: message.sender.role as Role,
			},
			createdAt: message.createdAt,
		};
	}
}
