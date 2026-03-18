import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalApiWalletFundsReleaseExecutorAdapter } from './internal-api-wallet-funds-release.executor';

test('InternalApiWalletFundsReleaseExecutorAdapter throws when the internal API returns a non-ok status', async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(null, { status: 500 });

	try {
		const adapter = new InternalApiWalletFundsReleaseExecutorAdapter({
			apiInternalBaseUrl: 'http://localhost:3000',
		} as never);

		await assert.rejects(
			adapter.execute({
				orderId: 'order-1',
				boosterId: 'booster-1',
				availableAt: '2026-03-12T12:00:00.000Z',
			}),
			(error: Error) =>
				error.message === 'Wallet release request failed with status 500.',
		);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
