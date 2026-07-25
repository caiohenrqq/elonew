import assert from 'node:assert/strict';
import test from 'node:test';
import { ScheduledTaskExecutionFailedError } from '@modules/scheduled-tasks/domain/scheduled-tasks.errors';
import type { ScheduledTask } from '@modules/scheduled-tasks/domain/scheduled-tasks.registry';
import { InternalApiScheduledTaskExecutorAdapter } from './internal-api-scheduled-task.executor';

const task: ScheduledTask = {
	name: 'reconcile_stale_checkouts',
	cron: '*/10 * * * *',
	route: '/payments/internal/reconcile-stale-checkouts',
	body: { limit: 50 },
};

const createAdapter = () =>
	new InternalApiScheduledTaskExecutorAdapter({
		apiInternalBaseUrl: 'http://localhost:3000',
		internalApiKey: 'internal-api-key',
	} as never);

const withStubbedFetch = async <T>(
	respond: () => Response,
	run: () => Promise<T>,
) => {
	const calls: Array<{ input: string; init?: RequestInit }> = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (input, init) => {
		calls.push({ input: String(input), init });

		return respond();
	};

	try {
		return { result: await run(), calls };
	} catch (error) {
		return { error, calls };
	} finally {
		globalThis.fetch = originalFetch;
	}
};

test('posts the declared route with the internal key, the task body and a fresh now', async () => {
	const startedAt = Date.now();
	const { result, calls } = await withStubbedFetch(
		() => new Response(null, { status: 200 }),
		() => createAdapter().execute(task),
	);

	assert.equal(
		calls[0]?.input,
		'http://localhost:3000/payments/internal/reconcile-stale-checkouts',
	);
	assert.equal(calls[0]?.init?.method, 'POST');

	const headers = calls[0]?.init?.headers as Record<string, string>;
	assert.equal(headers['x-internal-api-key'], 'internal-api-key');
	assert.match(headers['x-request-id'] ?? '', /^[0-9a-f-]{36}$/);

	const body = JSON.parse(String(calls[0]?.init?.body));
	assert.equal(body.limit, 50);
	const sentNow = new Date(body.now).getTime();
	assert.ok(sentNow >= startedAt && sentNow <= Date.now());

	assert.equal(result?.apiStatus, 200);
	assert.equal(result?.apiRequestId, headers['x-request-id']);
});

test('prefers the request id echoed by the API', async () => {
	const { result } = await withStubbedFetch(
		() =>
			new Response(null, {
				status: 200,
				headers: { 'x-request-id': 'api-request-id' },
			}),
		() => createAdapter().execute(task),
	);

	assert.equal(result?.apiRequestId, 'api-request-id');
});

test('carries the failing status on the error', async () => {
	const { error } = await withStubbedFetch(
		() => new Response(null, { status: 500 }),
		() => createAdapter().execute(task),
	);

	assert.ok(error instanceof ScheduledTaskExecutionFailedError);
	assert.equal(error.apiStatus, 500);
	assert.match(error.message, /reconcile_stale_checkouts/);
});
