import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	ChatMessageRecord,
	ChatMessageWriteResult,
	ChatOrderRecord,
	ChatRepositoryPort,
	ListChatMessagesInput,
	ListChatMessagesOutput,
} from '@modules/chat/application/ports/chat-repository.port';
import { ChatMessageNotFoundError } from '@modules/chat/domain/chat.errors';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	notificationPayloadSchema,
	notificationTypeSchema,
} from '@packages/shared/notifications/notification.schema';
import type { Prisma } from '@prisma/client';

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
		return (await this.createMessageWithNotification(input)).message;
	}

	async createMessageWithNotification(input: {
		chatId: string;
		senderId: string;
		content: string;
		notification?: {
			recipientId: string;
		};
	}): Promise<ChatMessageWriteResult> {
		return await this.prisma.$transaction(async (transaction) => {
			const message = await this.createMessageRecord(transaction, input);
			if (!input.notification) return { message: this.mapMessage(message) };

			const notification = await transaction.notification.upsert({
				where: {
					recipientId_type_aggregateKey: {
						recipientId: input.notification.recipientId,
						type: 'CHAT_MESSAGE_CREATED',
						aggregateKey: message.chat.orderId,
					},
				},
				create: {
					recipientId: input.notification.recipientId,
					type: 'CHAT_MESSAGE_CREATED',
					aggregateKey: message.chat.orderId,
					payload: this.buildChatNotificationPayload(message),
				},
				update: {
					payload: this.buildChatNotificationPayload(message),
					readAt: null,
					activityAt: new Date(),
				},
			});
			const unreadCount = await transaction.notification.count({
				where: {
					recipientId: input.notification.recipientId,
					readAt: null,
				},
			});

			return {
				message: this.mapMessage(message),
				notification: {
					notification: this.mapNotification(notification),
					unreadCount,
				},
			};
		});
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

	private async createMessageRecord(
		prisma: Prisma.TransactionClient,
		input: {
			chatId: string;
			senderId: string;
			content: string;
		},
	) {
		return await prisma.chatMessage.create({
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
	}

	private buildChatNotificationPayload(message: {
		id: string;
		chat: {
			orderId: string;
		};
		sender: {
			id: string;
			username: string;
		};
	}) {
		return {
			type: 'CHAT_MESSAGE_CREATED' as const,
			metadata: {
				orderId: message.chat.orderId,
				chatMessageId: message.id,
				senderId: message.sender.id,
				senderUsername: message.sender.username,
			},
		};
	}

	private mapNotification(notification: {
		id: string;
		type: string;
		payload: unknown;
		readAt: Date | null;
		activityAt: Date;
		createdAt: Date;
		updatedAt: Date;
	}) {
		return {
			id: notification.id,
			type: notificationTypeSchema.parse(notification.type),
			payload: notificationPayloadSchema.parse(notification.payload),
			readAt: notification.readAt?.toISOString() ?? null,
			activityAt: notification.activityAt.toISOString(),
			createdAt: notification.createdAt.toISOString(),
			updatedAt: notification.updatedAt.toISOString(),
		};
	}
}
