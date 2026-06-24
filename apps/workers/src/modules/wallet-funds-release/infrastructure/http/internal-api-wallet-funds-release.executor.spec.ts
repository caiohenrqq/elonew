import assert from 'node:assert/strict';
import test from 'node:test';
import { WalletFundsReleaseExecutionFailedError } from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
import { InternalApiWalletFundsReleaseExecutorAdapter } from './internal-api-wallet-funds-release.executor';

test('InternalApiWalletFundsReleaseExecutorAdapter throws when the internal API returns a non-ok status', async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(null, { status: 500 });

	try {
		const adapter = new InternalApiWalletFundsReleaseExecutorAdapter({
			apiInternalBaseUrl: 'http://localhost:3000',
			internalApiKey: 'internal-api-key',
		} as never);
		const availableAt = new Date('2026-03-12T12:00:00.000Z');

		await assert.rejects(
			adapter.execute({
				orderId: 'order-1',
				boosterId: 'booster-1',
				availableAt,
			}),
			(error: unknown) =>
				error instanceof WalletFundsReleaseExecutionFailedError &&
				error.message === 'Wallet release request failed with status 500.',
		);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('InternalApiWalletFundsReleaseExecutorAdapter authenticates internal API requests', async () => {
	const originalFetch = globalThis.fetch;
	let requestHeaders: Headers | undefined;
	globalThis.fetch = async (_input, init) => {
		requestHeaders = new Headers(init?.headers);
		return new Response(null, { status: 200 });
	};

	try {
		const adapter = new InternalApiWalletFundsReleaseExecutorAdapter({
			apiInternalBaseUrl: 'http://localhost:3000',
			internalApiKey: 'internal-api-key',
		} as never);

		await adapter.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
			availableAt: new Date('2026-03-12T12:00:00.000Z'),
		});

		assert.equal(requestHeaders?.get('x-internal-api-key'), 'internal-api-key');
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('InternalApiWalletFundsReleaseExecutorAdapter wraps transport failures in a typed execution error', async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		throw new Error('network down');
	};

	try {
		const adapter = new InternalApiWalletFundsReleaseExecutorAdapter({
			apiInternalBaseUrl: 'http://localhost:3000',
			internalApiKey: 'internal-api-key',
		} as never);

		await assert.rejects(
			adapter.execute({
				orderId: 'order-1',
				boosterId: 'booster-1',
				availableAt: new Date('2026-03-12T12:00:00.000Z'),
			}),
			(error: unknown) =>
				error instanceof WalletFundsReleaseExecutionFailedError &&
				error.message === 'Wallet release request failed: network down.',
		);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
