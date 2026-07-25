import assert from 'node:assert/strict';
import test from 'node:test';
import type { WalletFundsReleaseLifecycleLogEvent } from '@modules/wallet-funds-release/application/logging/wallet-funds-release-lifecycle.logger';
import {
	WalletFundsReleaseExecutionFailedError,
	WalletFundsReleaseInvalidJobError,
} from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
import { BullmqWalletFundsReleaseConsumerAdapter } from './bullmq-wallet-funds-release.consumer';
import type { WalletFundsReleaseJobExecution } from './bullmq-wallet-funds-release.worker-factory';

type ProcessJob = (job: WalletFundsReleaseJobExecution) => Promise<void>;

type ConsumerScenario = {
	isTest?: boolean;
	execute?: (job: {
		orderId: string;
		boosterId: string;
		availableAt: Date;
	}) => Promise<{ apiStatus: number; apiRequestId: string }>;
};

const createScenario = (scenario: ConsumerScenario = {}) => {
	const executeCalls: Array<{
		orderId: string;
		boosterId: string;
		availableAt: Date;
	}> = [];
	const events: WalletFundsReleaseLifecycleLogEvent[] = [];
	const state = { closed: false, createCalls: 0 };
	let processJob: ProcessJob | null = null;

	const adapter = new BullmqWalletFundsReleaseConsumerAdapter(
		{
			isTest: scenario.isTest ?? false,
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
				executeCalls.push(job);

				return scenario.execute
					? await scenario.execute(job)
					: { apiStatus: 200, apiRequestId: 'request-1' };
			},
		} as never,
		{
			create: (input: { processJob: ProcessJob }) => {
				state.createCalls += 1;
				processJob = input.processJob;

				return {
					close: async () => {
						state.closed = true;
					},
				};
			},
		} as never,
		{
			emit: (event: WalletFundsReleaseLifecycleLogEvent) => {
				events.push(event);
			},
		} as never,
		{ info: () => undefined, error: () => undefined } as never,
	);

	return {
		adapter,
		events,
		executeCalls,
		state,
		getProcessJob: (): ProcessJob => {
			if (!processJob) throw new Error('Expected BullMQ process job handler.');

			return processJob;
		},
	};
};

const jobExecution = (availableAt: string): WalletFundsReleaseJobExecution => ({
	data: { orderId: 'order-1', boosterId: 'booster-1', availableAt },
	jobId: 'booster-1__order-1',
	attempt: 2,
});

test('BullmqWalletFundsReleaseConsumerAdapter boots the BullMQ worker and routes jobs into the use case', async () => {
	const scenario = createScenario();

	scenario.adapter.onApplicationBootstrap();
	const availableAt = '2026-03-12T12:00:00.000Z';
	await scenario.getProcessJob()(jobExecution(availableAt));
	await scenario.adapter.onApplicationShutdown();

	assert.equal(scenario.executeCalls.length, 1);
	assert.deepEqual(scenario.executeCalls[0], {
		orderId: 'order-1',
		boosterId: 'booster-1',
		availableAt: new Date(availableAt),
	});
	assert.ok(scenario.executeCalls[0]?.availableAt instanceof Date);
	assert.equal(scenario.state.closed, true);
});

test('BullmqWalletFundsReleaseConsumerAdapter emits one lifecycle event carrying job correlation fields', async () => {
	const scenario = createScenario();

	scenario.adapter.onApplicationBootstrap();
	await scenario.getProcessJob()(jobExecution('2026-03-12T12:00:00.000Z'));

	assert.equal(scenario.events.length, 1);
	assert.deepEqual(scenario.events[0], {
		event: 'wallet_funds_release.lifecycle',
		operation: 'process_job',
		outcome: 'success',
		job_id: 'booster-1__order-1',
		queue_name: 'wallet-funds-release',
		attempt: 2,
		booster_id: 'booster-1',
		order_id: 'order-1',
		available_at: '2026-03-12T12:00:00.000Z',
		api_status: 200,
		api_request_id: 'request-1',
	});
});

test('BullmqWalletFundsReleaseConsumerAdapter skips worker bootstrap in test mode', async () => {
	const scenario = createScenario({ isTest: true });

	scenario.adapter.onApplicationBootstrap();
	await scenario.adapter.onApplicationShutdown();

	assert.equal(scenario.state.createCalls, 0);
});

test('BullmqWalletFundsReleaseConsumerAdapter rejects invalid queue payload dates before entering the use case', async () => {
	const scenario = createScenario();

	scenario.adapter.onApplicationBootstrap();
	await assert.rejects(
		scenario.getProcessJob()(jobExecution('not-a-date')),
		(error: unknown) => error instanceof WalletFundsReleaseInvalidJobError,
	);

	assert.equal(scenario.executeCalls.length, 0);
	assert.equal(scenario.events.length, 1);
	assert.equal(scenario.events[0]?.outcome, 'error');
	assert.equal(
		scenario.events[0]?.error_type,
		'WalletFundsReleaseInvalidJobError',
	);
});

test('BullmqWalletFundsReleaseConsumerAdapter records the API status of a failed release attempt', async () => {
	const scenario = createScenario({
		execute: async () => {
			throw new WalletFundsReleaseExecutionFailedError(
				'Wallet release request failed with status 503.',
				503,
			);
		},
	});

	scenario.adapter.onApplicationBootstrap();
	await assert.rejects(
		scenario.getProcessJob()(jobExecution('2026-03-12T12:00:00.000Z')),
	);

	assert.equal(scenario.events[0]?.outcome, 'error');
	assert.equal(scenario.events[0]?.api_status, 503);
	assert.equal(
		scenario.events[0]?.error_type,
		'WalletFundsReleaseExecutionFailedError',
	);
});
