import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	ListNotificationsInput,
	ListNotificationsOutput,
	NotificationRecord,
	NotificationRepositoryPort,
	UpsertNotificationInput,
} from '@modules/notifications/application/ports/notification-repository.port';
import { Injectable } from '@nestjs/common';
import {
	notificationPayloadSchema,
	notificationTypeSchema,
} from '@packages/shared/notifications/notification.schema';

type PersistedNotification = {
	id: string;
	recipientId: string;
	type: string;
	aggregateKey: string;
	payload: unknown;
	readAt: Date | null;
	activityAt: Date;
	createdAt: Date;
	updatedAt: Date;
};

@Injectable()
export class PrismaNotificationRepository
	implements NotificationRepositoryPort
{
	constructor(private readonly prisma: PrismaService) {}

	async countUnread(recipientId: string): Promise<number> {
		return await this.prisma.notification.count({
			where: {
				recipientId,
				readAt: null,
			},
		});
	}

	async list(input: ListNotificationsInput): Promise<ListNotificationsOutput> {
		const notifications = await this.prisma.notification.findMany({
			where: { recipientId: input.recipientId },
			cursor: input.cursor ? { id: input.cursor } : undefined,
			skip: input.cursor ? 1 : 0,
			take: input.limit + 1,
			orderBy: [{ activityAt: 'desc' }, { id: 'desc' }],
		});
		const page = notifications.slice(0, input.limit);
		const unreadCount = await this.countUnread(input.recipientId);

		return {
			items: page.map((notification) =>
				this.mapNotification(notification as PersistedNotification),
			),
			nextCursor:
				notifications.length > input.limit
					? (page[page.length - 1]?.id ?? null)
					: null,
			unreadCount,
		};
	}

	async markRead(input: {
		notificationId: string;
		recipientId: string;
		readAt: Date;
		expectedActivityAt?: Date;
	}): Promise<NotificationRecord | 'changed' | null> {
		if (input.expectedActivityAt) {
			const result = await this.prisma.notification.updateMany({
				where: {
					id: input.notificationId,
					recipientId: input.recipientId,
					activityAt: input.expectedActivityAt,
				},
				data: { readAt: input.readAt },
			});
			if (result.count === 0) {
				const existing = await this.prisma.notification.findFirst({
					where: {
						id: input.notificationId,
						recipientId: input.recipientId,
					},
					select: { id: true },
				});
				return existing ? 'changed' : null;
			}

			const updated = await this.prisma.notification.findUnique({
				where: { id: input.notificationId },
			});
			return updated
				? this.mapNotification(updated as PersistedNotification)
				: null;
		}

		const notification = await this.prisma.notification.findFirst({
			where: {
				id: input.notificationId,
				recipientId: input.recipientId,
			},
		});
		if (!notification) return null;

		return this.mapNotification(
			(await this.prisma.notification.update({
				where: { id: notification.id },
				data: {
					readAt: notification.readAt ?? input.readAt,
				},
			})) as PersistedNotification,
		);
	}

	async markAllRead(input: {
		recipientId: string;
		readAt: Date;
		cutoffActivityAt: Date;
	}): Promise<number> {
		const result = await this.prisma.notification.updateMany({
			where: {
				recipientId: input.recipientId,
				readAt: null,
				activityAt: {
					lte: input.cutoffActivityAt,
				},
			},
			data: {
				readAt: input.readAt,
			},
		});

		return result.count;
	}

	async upsert(input: UpsertNotificationInput): Promise<NotificationRecord> {
		return this.mapNotification(
			(await this.prisma.notification.upsert({
				where: {
					recipientId_type_aggregateKey: {
						recipientId: input.recipientId,
						type: input.type,
						aggregateKey: input.aggregateKey,
					},
				},
				create: {
					recipientId: input.recipientId,
					type: input.type,
					aggregateKey: input.aggregateKey,
					payload: input.payload,
				},
				update: {
					payload: input.payload,
					readAt: null,
					activityAt: new Date(),
				},
			})) as PersistedNotification,
		);
	}

	private mapNotification(
		notification: PersistedNotification,
	): NotificationRecord {
		return {
			id: notification.id,
			recipientId: notification.recipientId,
			type: notificationTypeSchema.parse(notification.type),
			aggregateKey: notification.aggregateKey,
			payload: notificationPayloadSchema.parse(notification.payload),
			readAt: notification.readAt,
			activityAt: notification.activityAt,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
		};
	}
}
