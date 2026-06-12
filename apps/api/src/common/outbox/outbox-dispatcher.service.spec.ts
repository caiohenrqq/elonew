import { OutboxDispatcherService } from '@app/common/outbox/outbox-dispatcher.service';
import type { OutboxEventRecord } from '@app/common/outbox/outbox-event';
import { OutboxHandlerRegistry } from '@app/common/outbox/outbox-event-handler';
import type { OutboxStore } from '@app/common/outbox/outbox-store';
import type { AppSettingsService } from '@app/common/settings/app-settings.service';

class FakeOutboxStore implements OutboxStore {
	readonly published: Array<{ id: string; publishedAt: Date }> = [];
	readonly retried: Array<{
		id: string;
		attempts: number;
		availableAt: Date;
		lastError: string;
	}> = [];
	readonly failed: Array<{ id: string; attempts: number; lastError: string }> =
		[];

	constructor(private readonly pending: OutboxEventRecord[]) {}

	async fetchPending(now: Date, limit: number): Promise<OutboxEventRecord[]> {
		return this.pending
			.filter((event) => event.status === 'PENDING' && event.availableAt <= now)
			.slice(0, limit);
	}

	async markPublished(id: string, publishedAt: Date): Promise<void> {
		this.published.push({ id, publishedAt });
	}

	async markRetry(input: {
		id: string;
		attempts: number;
		availableAt: Date;
		lastError: string;
	}): Promise<void> {
		this.retried.push(input);
	}

	async markFailed(input: {
		id: string;
		attempts: number;
		lastError: string;
	}): Promise<void> {
		this.failed.push(input);
	}
}

const makeRecord = (
	overrides: Partial<OutboxEventRecord> = {},
): OutboxEventRecord => ({
	id: 'evt-1',
	aggregateType: 'notification',
	aggregateId: 'user-1',
	eventType: 'notification.updated',
	payload: { hello: 'world' },
	status: 'PENDING',
	attempts: 0,
	availableAt: new Date('2026-06-12T00:00:00.000Z'),
	publishedAt: null,
	lastError: null,
	createdAt: new Date('2026-06-12T00:00:00.000Z'),
	updatedAt: new Date('2026-06-12T00:00:00.000Z'),
	...overrides,
});

const testSettings = { isTest: true } as AppSettingsService;
const NOW = new Date('2026-06-12T01:00:00.000Z');

describe('OutboxDispatcherService', () => {
	it('dispatches a pending event to its handler and marks it published', async () => {
		const handled: OutboxEventRecord[] = [];
		const registry = new OutboxHandlerRegistry();
		registry.register({
			eventTypes: ['notification.updated'],
			handle: (event) => {
				handled.push(event);
			},
		});
		const store = new FakeOutboxStore([makeRecord()]);
		const dispatcher = new OutboxDispatcherService(
			store,
			registry,
			testSettings,
		);

		await dispatcher.processPendingBatch(NOW);

		expect(handled).toHaveLength(1);
		expect(store.published).toEqual([{ id: 'evt-1', publishedAt: NOW }]);
		expect(store.failed).toEqual([]);
		expect(store.retried).toEqual([]);
	});

	it('retries with backoff when the handler throws below the attempt ceiling', async () => {
		const registry = new OutboxHandlerRegistry();
		registry.register({
			eventTypes: ['notification.updated'],
			handle: () => {
				throw new Error('socket down');
			},
		});
		const store = new FakeOutboxStore([makeRecord({ attempts: 0 })]);
		const dispatcher = new OutboxDispatcherService(
			store,
			registry,
			testSettings,
		);

		await dispatcher.processPendingBatch(NOW);

		expect(store.published).toEqual([]);
		expect(store.retried).toHaveLength(1);
		expect(store.retried[0]).toMatchObject({
			id: 'evt-1',
			attempts: 1,
			lastError: 'socket down',
		});
		expect(store.retried[0]?.availableAt.getTime()).toBeGreaterThan(
			NOW.getTime(),
		);
		expect(store.failed).toEqual([]);
	});

	it('marks the event failed once the retry ceiling is reached', async () => {
		const registry = new OutboxHandlerRegistry();
		registry.register({
			eventTypes: ['notification.updated'],
			handle: () => {
				throw new Error('socket down');
			},
		});
		const store = new FakeOutboxStore([makeRecord({ attempts: 9 })]);
		const dispatcher = new OutboxDispatcherService(
			store,
			registry,
			testSettings,
		);

		await dispatcher.processPendingBatch(NOW);

		expect(store.retried).toEqual([]);
		expect(store.failed).toEqual([
			{ id: 'evt-1', attempts: 10, lastError: 'socket down' },
		]);
	});

	it('marks the event failed when no handler is registered', async () => {
		const handled: OutboxEventRecord[] = [];
		const registry = new OutboxHandlerRegistry();
		registry.register({
			eventTypes: ['other.event'],
			handle: (event) => {
				handled.push(event);
			},
		});
		const store = new FakeOutboxStore([
			makeRecord({ eventType: 'notification.updated' }),
		]);
		const dispatcher = new OutboxDispatcherService(
			store,
			registry,
			testSettings,
		);

		await dispatcher.processPendingBatch(NOW);

		expect(handled).toEqual([]);
		expect(store.published).toEqual([]);
		expect(store.failed).toHaveLength(1);
		expect(store.failed[0]).toMatchObject({ id: 'evt-1', attempts: 1 });
	});
});
