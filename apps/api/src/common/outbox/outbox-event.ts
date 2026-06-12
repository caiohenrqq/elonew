import type { OutboxEventStatus } from '@prisma/client';

export type OutboxEventPayload = Record<string, unknown>;

export type OutboxEventInput = {
	aggregateType: string;
	aggregateId: string;
	eventType: string;
	payload: OutboxEventPayload;
};

export type OutboxEventRecord = {
	id: string;
	aggregateType: string;
	aggregateId: string;
	eventType: string;
	payload: OutboxEventPayload;
	status: OutboxEventStatus;
	attempts: number;
	availableAt: Date;
	publishedAt: Date | null;
	lastError: string | null;
	createdAt: Date;
	updatedAt: Date;
};
