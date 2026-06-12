import { PrismaService } from '@app/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import type { OutboxEventPayload, OutboxEventRecord } from './outbox-event';
import type { OutboxStore } from './outbox-store';

type PersistedOutboxEvent = {
	id: string;
	aggregateType: string;
	aggregateId: string;
	eventType: string;
	payload: unknown;
	status: OutboxEventRecord['status'];
	attempts: number;
	availableAt: Date;
	publishedAt: Date | null;
	lastError: string | null;
	createdAt: Date;
	updatedAt: Date;
};

@Injectable()
export class PrismaOutboxStore implements OutboxStore {
	constructor(private readonly prisma: PrismaService) {}

	async fetchPending(now: Date, limit: number): Promise<OutboxEventRecord[]> {
		const rows = await this.prisma.outboxEvent.findMany({
			where: { status: 'PENDING', availableAt: { lte: now } },
			orderBy: { createdAt: 'asc' },
			take: limit,
		});

		return rows.map((row) => this.mapRecord(row));
	}

	async markPublished(id: string, publishedAt: Date): Promise<void> {
		await this.prisma.outboxEvent.updateMany({
			where: { id, status: 'PENDING' },
			data: { status: 'PUBLISHED', publishedAt },
		});
	}

	async markRetry(input: {
		id: string;
		attempts: number;
		availableAt: Date;
		lastError: string;
	}): Promise<void> {
		await this.prisma.outboxEvent.updateMany({
			where: { id: input.id, status: 'PENDING' },
			data: {
				attempts: input.attempts,
				availableAt: input.availableAt,
				lastError: input.lastError,
			},
		});
	}

	async markFailed(input: {
		id: string;
		attempts: number;
		lastError: string;
	}): Promise<void> {
		await this.prisma.outboxEvent.updateMany({
			where: { id: input.id, status: 'PENDING' },
			data: {
				status: 'FAILED',
				attempts: input.attempts,
				lastError: input.lastError,
			},
		});
	}

	private mapRecord(row: PersistedOutboxEvent): OutboxEventRecord {
		return {
			id: row.id,
			aggregateType: row.aggregateType,
			aggregateId: row.aggregateId,
			eventType: row.eventType,
			payload: (row.payload ?? {}) as OutboxEventPayload,
			status: row.status,
			attempts: row.attempts,
			availableAt: row.availableAt,
			publishedAt: row.publishedAt,
			lastError: row.lastError,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
