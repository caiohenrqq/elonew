import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryProcessedWebhookEventRepository
	implements ProcessedWebhookEventPort
{
	private readonly processedEventIds = new Set<string>();

	async has(eventId: string): Promise<boolean> {
		return this.processedEventIds.has(eventId);
	}

	async markProcessed(eventId: string): Promise<void> {
		this.processedEventIds.add(eventId);
	}
}
