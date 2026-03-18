import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalApiWalletFundsReleaseExecutorAdapter } from './modules/wallet-funds-release/infrastructure/http/internal-api-wallet-funds-release.executor';

test('InternalApiWalletFundsReleaseExecutorAdapter posts the targeted release payload to the internal API', async () => {
	const calls: Array<{
		input: string;
		init?: RequestInit;
	}> = [];
	const originalFetch = globalThis.fetch;

	globalThis.fetch = async (input, init) => {
		calls.push({ input: String(input), init });

		return new Response(null, { status: 200 });
	};

	try {
		const adapter = new InternalApiWalletFundsReleaseExecutorAdapter({
			apiInternalBaseUrl: 'http://localhost:3000',
		} as never);
		await adapter.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
			availableAt: new Date('2026-03-12T12:00:00.000Z'),
		});
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(calls, [
		{
			input: 'http://localhost:3000/wallets/internal/release-matured-funds',
			init: {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					orderId: 'order-1',
					boosterId: 'booster-1',
					now: '2026-03-12T12:00:00.000Z',
				}),
			},
		},
	]);
});
