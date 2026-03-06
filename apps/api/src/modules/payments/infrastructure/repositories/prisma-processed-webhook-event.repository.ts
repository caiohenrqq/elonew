import { PrismaService } from '@app/common/prisma/prisma.service';
import type { ProcessedWebhookEventPort } from '@modules/payments/application/ports/processed-webhook-event.port';
import { Injectable } from '@nestjs/common';

type ProcessedWebhookEventRecord = {
	eventId: string;
};

type ProcessedWebhookEventDelegate = {
	findUnique(args: {
		where: { eventId: string };
	}): Promise<ProcessedWebhookEventRecord | null>;
	upsert(args: {
		where: { eventId: string };
		create: { eventId: string };
		update: Record<string, never>;
	}): Promise<ProcessedWebhookEventRecord>;
};

type ProcessedWebhookEventPrismaClient = {
	processedWebhookEvent: ProcessedWebhookEventDelegate;
};

@Injectable()
export class PrismaProcessedWebhookEventRepository
	implements ProcessedWebhookEventPort
{
	constructor(private readonly prisma: PrismaService) {}

	async has(eventId: string): Promise<boolean> {
		const record = await this.getDelegate().findUnique({ where: { eventId } });
		return Boolean(record);
	}

	async markProcessed(eventId: string): Promise<void> {
		await this.getDelegate().upsert({
			where: { eventId },
			create: { eventId },
			update: {},
		});
	}

	private getDelegate(): ProcessedWebhookEventDelegate {
		return (this.prisma as unknown as ProcessedWebhookEventPrismaClient)
			.processedWebhookEvent;
	}
}
