import { OutboxModule } from '@app/common/outbox/outbox.module';
import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CHAT_REPOSITORY_KEY } from '@modules/chat/application/ports/chat-repository.port';
import { CHAT_THREAD_WRITER_KEY } from '@modules/chat/application/ports/chat-thread-writer.port';
import { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
import { PrismaChatRepository } from '@modules/chat/infrastructure/repositories/prisma-chat.repository';
import { AdminChatController } from '@modules/chat/presentation/admin-chat.controller';
import { ChatController } from '@modules/chat/presentation/chat.controller';
import { ChatGateway } from '@modules/chat/presentation/chat.gateway';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, AuthModule, NotificationsModule, OutboxModule],
	controllers: [AdminChatController, ChatController],
	providers: [
		PrismaChatRepository,
		{
			provide: CHAT_REPOSITORY_KEY,
			useExisting: PrismaChatRepository,
		},
		{
			provide: CHAT_THREAD_WRITER_KEY,
			useExisting: PrismaChatRepository,
		},
		ListChatMessagesUseCase,
		SendChatMessageUseCase,
		ChatGateway,
	],
	exports: [CHAT_THREAD_WRITER_KEY],
})
export class ChatModule {}
