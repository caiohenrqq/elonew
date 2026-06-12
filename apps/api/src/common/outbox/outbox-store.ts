import type { OutboxEventRecord } from './outbox-event';

export const OUTBOX_STORE = Symbol('OUTBOX_STORE');

export interface OutboxStore {
	fetchPending(now: Date, limit: number): Promise<OutboxEventRecord[]>;
	markPublished(id: string, publishedAt: Date): Promise<void>;
	markRetry(input: {
		id: string;
		attempts: number;
		availableAt: Date;
		lastError: string;
	}): Promise<void>;
	markFailed(input: {
		id: string;
		attempts: number;
		lastError: string;
	}): Promise<void>;
}
