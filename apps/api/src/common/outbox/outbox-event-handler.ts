import { Injectable } from '@nestjs/common';
import type { OutboxEventRecord } from './outbox-event';

export interface OutboxEventHandler {
	readonly eventTypes: readonly string[];
	handle(event: OutboxEventRecord): Promise<void> | void;
}

@Injectable()
export class OutboxHandlerRegistry {
	private readonly handlers = new Map<string, OutboxEventHandler>();

	register(handler: OutboxEventHandler): void {
		for (const eventType of handler.eventTypes)
			this.handlers.set(eventType, handler);
	}

	resolve(eventType: string): OutboxEventHandler | null {
		return this.handlers.get(eventType) ?? null;
	}
}
