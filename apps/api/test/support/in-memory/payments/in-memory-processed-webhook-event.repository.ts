import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryProcessedWebhookEventRepository
	implements ProcessedWebhookEventPort
{
	private readonly processedEventIds = new Set<string>();

	has(eventId: string): Promise<boolean> {
		return Promise.resolve(this.processedEventIds.has(eventId));
	}

	markProcessed(eventId: string): Promise<void> {
		this.processedEventIds.add(eventId);
		return Promise.resolve();
	}
}
