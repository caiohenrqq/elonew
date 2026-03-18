import assert from 'node:assert/strict';
import test from 'node:test';
import { BullmqWalletFundsReleaseConsumerAdapter } from './bullmq-wallet-funds-release.consumer';

test('BullmqWalletFundsReleaseConsumerAdapter boots the BullMQ worker and routes jobs into the use case', async () => {
	let capturedProcessJob:
		| ((job: {
				orderId: string;
				boosterId: string;
				availableAt: string;
		  }) => Promise<void>)
		| null = null;
	let closed = false;
	const calls: Array<{
		orderId: string;
		boosterId: string;
		availableAt: string;
	}> = [];

	const adapter = new BullmqWalletFundsReleaseConsumerAdapter(
		{
			isTest: false,
			walletFundsReleaseQueueName: 'wallet-funds-release',
			redisUrl: 'redis://localhost:6379',
			workerConcurrency: 5,
		} as never,
		{
			execute: async (job: {
				orderId: string;
				boosterId: string;
				availableAt: string;
			}) => {
				calls.push(job);
			},
		} as never,
		{
			create: (input: {
				processJob(job: {
					orderId: string;
					boosterId: string;
					availableAt: string;
				}): Promise<void>;
			}) => {
				capturedProcessJob = input.processJob;

				return {
					close: async () => {
						closed = true;
					},
				};
			},
		} as never,
	);

	await adapter.onApplicationBootstrap();
	if (!capturedProcessJob)
		throw new Error('Expected BullMQ process job handler.');

	const processJob: (job: {
		orderId: string;
		boosterId: string;
		availableAt: string;
	}) => Promise<void> = capturedProcessJob;
	await processJob({
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt: '2026-03-12T12:00:00.000Z',
	});
	await adapter.onApplicationShutdown();

	assert.deepEqual(calls, [
		{
			orderId: 'order-1',
			boosterId: 'booster-1',
			availableAt: '2026-03-12T12:00:00.000Z',
		},
	]);
	assert.equal(closed, true);
});
