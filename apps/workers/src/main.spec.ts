import assert from 'node:assert/strict';
import test from 'node:test';
import { WalletFundsReleaseExecutionFailedError } from './modules/wallet-funds-release/domain/wallet-funds-release.errors';
import { InternalApiWalletFundsReleaseExecutorAdapter } from './modules/wallet-funds-release/infrastructure/http/internal-api-wallet-funds-release.executor';

const createAdapter = () =>
	new InternalApiWalletFundsReleaseExecutorAdapter({
		apiInternalBaseUrl: 'http://localhost:3000',
		internalApiKey: 'internal-api-key',
	} as never);

const job = {
	orderId: 'order-1',
	boosterId: 'booster-1',
	availableAt: new Date('2026-03-12T12:00:00.000Z'),
};

const withStubbedFetch = async <T>(
	respond: (input: string, init?: RequestInit) => Response,
	run: () => Promise<T>,
): Promise<{
	result?: T;
	error?: unknown;
	calls: Array<{ input: string; init?: RequestInit }>;
}> => {
	const calls: Array<{ input: string; init?: RequestInit }> = [];
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (input, init) => {
		calls.push({ input: String(input), init });

		return respond(String(input), init);
	};

	try {
		return { result: await run(), calls };
	} catch (error) {
		return { error, calls };
	} finally {
		globalThis.fetch = originalFetch;
	}
};

test('InternalApiWalletFundsReleaseExecutorAdapter posts the targeted release payload to the internal API', async () => {
	const adapter = createAdapter();
	const startedAt = Date.now();

	const { result, calls } = await withStubbedFetch(
		() => new Response(null, { status: 200 }),
		() => adapter.execute(job),
	);

	assert.equal(calls.length, 1);
	assert.equal(
		calls[0]?.input,
		'http://localhost:3000/wallets/internal/release-matured-funds',
	);
	assert.equal(calls[0]?.init?.method, 'POST');

	const headers = calls[0]?.init?.headers as Record<string, string>;
	assert.equal(headers['content-type'], 'application/json');
	assert.equal(headers['x-internal-api-key'], 'internal-api-key');
	assert.match(headers['x-request-id'] ?? '', /^[0-9a-f-]{36}$/);

	const body = JSON.parse(String(calls[0]?.init?.body));
	assert.equal(body.orderId, 'order-1');
	assert.equal(body.boosterId, 'booster-1');
	// The release is stamped with the real execution time, never the job's due
	// date, so a job that ran late is visible as late.
	const sentNow = new Date(body.now).getTime();
	assert.ok(sentNow >= startedAt && sentNow <= Date.now());
	assert.notEqual(body.now, job.availableAt.toISOString());

	assert.equal(result?.apiStatus, 200);
	assert.equal(result?.apiRequestId, headers['x-request-id']);
});

test('InternalApiWalletFundsReleaseExecutorAdapter prefers the request id echoed by the API', async () => {
	const adapter = createAdapter();

	const { result } = await withStubbedFetch(
		() =>
			new Response(null, {
				status: 200,
				headers: { 'x-request-id': 'api-request-id' },
			}),
		() => adapter.execute(job),
	);

	assert.equal(result?.apiRequestId, 'api-request-id');
});

test('InternalApiWalletFundsReleaseExecutorAdapter carries the failing status on the error', async () => {
	const adapter = createAdapter();

	const { error } = await withStubbedFetch(
		() => new Response(null, { status: 503 }),
		() => adapter.execute(job),
	);

	assert.ok(error instanceof WalletFundsReleaseExecutionFailedError);
	assert.equal(error.apiStatus, 503);
});
