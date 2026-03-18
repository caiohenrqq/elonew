import assert from 'node:assert/strict';
import test from 'node:test';
import type { WalletFundsReleaseExecutorPort } from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import type { ProcessWalletFundsReleaseJobInput } from '@modules/wallet-funds-release/application/process-wallet-funds-release-job.input';
import { ProcessWalletFundsReleaseJobUseCase } from './process-wallet-funds-release-job.use-case';

class InMemoryWalletFundsReleaseExecutor
	implements WalletFundsReleaseExecutorPort
{
	public readonly jobs: ProcessWalletFundsReleaseJobInput[] = [];

	async execute(input: ProcessWalletFundsReleaseJobInput): Promise<void> {
		this.jobs.push(input);
	}
}

test('ProcessWalletFundsReleaseJobUseCase delegates the internal processing input to the executor port', async () => {
	const executor = new InMemoryWalletFundsReleaseExecutor();
	const useCase = new ProcessWalletFundsReleaseJobUseCase(executor);
	const availableAt = new Date('2026-03-12T12:00:00.000Z');

	await useCase.execute({
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt,
	});

	assert.equal(executor.jobs.length, 1);
	assert.deepEqual(executor.jobs[0], {
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt,
	});
	assert.equal(executor.jobs[0]?.availableAt, availableAt);
});
