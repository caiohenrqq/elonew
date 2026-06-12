import { Global, Module } from '@nestjs/common';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxHandlerRegistry } from './outbox-event-handler';
import { OUTBOX_STORE } from './outbox-store';
import { OutboxWriter } from './outbox-writer';
import { PrismaOutboxStore } from './prisma-outbox.store';

@Global()
@Module({
	providers: [
		OutboxWriter,
		OutboxHandlerRegistry,
		PrismaOutboxStore,
		{ provide: OUTBOX_STORE, useExisting: PrismaOutboxStore },
		OutboxDispatcherService,
	],
	exports: [OutboxWriter, OutboxHandlerRegistry],
})
export class OutboxModule {}
