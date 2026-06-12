import { OutboxModule } from '@app/common/outbox/outbox.module';
import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { NOTIFICATION_EVENTS_KEY } from '@modules/notifications/application/ports/notification-events.port';
import { NOTIFICATION_REPOSITORY_KEY } from '@modules/notifications/application/ports/notification-repository.port';
import { ListNotificationsUseCase } from '@modules/notifications/application/use-cases/list-notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@modules/notifications/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@modules/notifications/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import { UpsertChatNotificationUseCase } from '@modules/notifications/application/use-cases/upsert-chat-notification/upsert-chat-notification.use-case';
import { NotificationOutboxHandler } from '@modules/notifications/infrastructure/outbox/notification-outbox.handler';
import { PrismaNotificationRepository } from '@modules/notifications/infrastructure/repositories/prisma-notification.repository';
import { NotificationsController } from '@modules/notifications/presentation/notifications.controller';
import { NotificationsGateway } from '@modules/notifications/presentation/notifications.gateway';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, AuthModule, OutboxModule],
	controllers: [NotificationsController],
	providers: [
		PrismaNotificationRepository,
		{
			provide: NOTIFICATION_REPOSITORY_KEY,
			useFactory: (
				notificationRepository: PrismaNotificationRepository,
			): PrismaNotificationRepository => notificationRepository,
			inject: [PrismaNotificationRepository],
		},
		NotificationsGateway,
		{
			provide: NOTIFICATION_EVENTS_KEY,
			useFactory: (
				notificationsGateway: NotificationsGateway,
			): NotificationsGateway => notificationsGateway,
			inject: [NotificationsGateway],
		},
		ListNotificationsUseCase,
		MarkNotificationReadUseCase,
		MarkAllNotificationsReadUseCase,
		UpsertChatNotificationUseCase,
		NotificationOutboxHandler,
	],
	exports: [NOTIFICATION_EVENTS_KEY, UpsertChatNotificationUseCase],
})
export class NotificationsModule {}
