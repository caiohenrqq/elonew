import assert from 'node:assert/strict';
import test from 'node:test';
import type { WalletFundsReleaseExecutorPort } from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import { ProcessWalletFundsReleaseJobUseCase } from './process-wallet-funds-release-job.use-case';

class InMemoryWalletFundsReleaseExecutor
	implements WalletFundsReleaseExecutorPort
{
	public readonly jobs = [] as {
		orderId: string;
		boosterId: string;
		availableAt: string;
	}[];

	async execute(input: {
		orderId: string;
		boosterId: string;
		availableAt: string;
	}): Promise<void> {
		this.jobs.push(input);
	}
}

test('ProcessWalletFundsReleaseJobUseCase delegates the shared job contract to the executor port', async () => {
	const executor = new InMemoryWalletFundsReleaseExecutor();
	const useCase = new ProcessWalletFundsReleaseJobUseCase(executor);

	await useCase.execute({
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt: '2026-03-12T12:00:00.000Z',
	});

	assert.deepEqual(executor.jobs, [
		{
			orderId: 'order-1',
			boosterId: 'booster-1',
			availableAt: '2026-03-12T12:00:00.000Z',
		},
	]);
});
