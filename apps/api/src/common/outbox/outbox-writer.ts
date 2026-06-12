import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { OutboxEventInput } from './outbox-event';

@Injectable()
export class OutboxWriter {
	async write(
		tx: Prisma.TransactionClient,
		input: OutboxEventInput,
	): Promise<void> {
		await tx.outboxEvent.create({
			data: {
				aggregateType: input.aggregateType,
				aggregateId: input.aggregateId,
				eventType: input.eventType,
				payload: input.payload as Prisma.InputJsonValue,
			},
		});
	}
}
