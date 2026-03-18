import assert from 'node:assert/strict';
import test from 'node:test';
import { WalletFundsReleaseInvalidJobError } from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
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
		availableAt: Date;
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
				availableAt: Date;
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
	const availableAt = '2026-03-12T12:00:00.000Z';
	await processJob({
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt,
	});
	await adapter.onApplicationShutdown();

	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0], {
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt: new Date(availableAt),
	});
	assert.ok(calls[0]?.availableAt instanceof Date);
	assert.equal(closed, true);
});

test('BullmqWalletFundsReleaseConsumerAdapter skips worker bootstrap in test mode', async () => {
	let createCalls = 0;

	const adapter = new BullmqWalletFundsReleaseConsumerAdapter(
		{
			isTest: true,
			walletFundsReleaseQueueName: 'wallet-funds-release',
			redisUrl: 'redis://localhost:6379',
			workerConcurrency: 5,
		} as never,
		{
			execute: async () => undefined,
		} as never,
		{
			create: () => {
				createCalls += 1;

				return {
					close: async () => undefined,
				};
			},
		} as never,
	);

	await adapter.onApplicationBootstrap();
	await adapter.onApplicationShutdown();

	assert.equal(createCalls, 0);
});

test('BullmqWalletFundsReleaseConsumerAdapter rejects invalid queue payload dates before entering the use case', async () => {
	let capturedProcessJob:
		| ((job: {
				orderId: string;
				boosterId: string;
				availableAt: string;
		  }) => Promise<void>)
		| null = null;
	let executeCalls = 0;

	const adapter = new BullmqWalletFundsReleaseConsumerAdapter(
		{
			isTest: false,
			walletFundsReleaseQueueName: 'wallet-funds-release',
			redisUrl: 'redis://localhost:6379',
			workerConcurrency: 5,
		} as never,
		{
			execute: async () => {
				executeCalls += 1;
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
					close: async () => undefined,
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

	await assert.rejects(
		processJob({
			orderId: 'order-1',
			boosterId: 'booster-1',
			availableAt: 'not-a-date',
		}),
		(error: unknown) => error instanceof WalletFundsReleaseInvalidJobError,
	);

	assert.equal(executeCalls, 0);
});
