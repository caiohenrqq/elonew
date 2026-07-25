import assert from 'node:assert/strict';
import test from 'node:test';
import type { ScheduledTaskLifecycleLogEvent } from '@modules/scheduled-tasks/application/logging/scheduled-task-lifecycle.logger';
import {
	ScheduledTaskExecutionFailedError,
	UnknownScheduledTaskError,
} from '@modules/scheduled-tasks/domain/scheduled-tasks.errors';
import { buildScheduledTasks } from '@modules/scheduled-tasks/domain/scheduled-tasks.registry';
import { BullmqScheduledTasksConsumerAdapter } from './bullmq-scheduled-tasks.consumer';
import type {
	ScheduledTaskJobExecution,
	ScheduledTaskSchedulerState,
} from './bullmq-scheduled-tasks.queue-factory';

const settings = {
	queuesEnabled: true,
	redisUrl: 'redis://localhost:6379',
	workerConcurrency: 5,
	scheduledTasksQueueName: 'scheduled-tasks',
	staleCheckoutReconcileCron: '*/10 * * * *',
	staleCheckoutReconcileLimit: 50,
	orderQuoteCleanupCron: '*/15 * * * *',
	orderQuoteCleanupLimit: 500,
};

type ProcessJob = (job: ScheduledTaskJobExecution) => Promise<void>;

const createScenario = (
	options: {
		existingSchedules?: ScheduledTaskSchedulerState[];
		execute?: (
			taskName: string,
		) => Promise<{ apiStatus: number; apiRequestId: string }>;
		queuesEnabled?: boolean;
	} = {},
) => {
	const upserted: Array<{ name: string; cron: string }> = [];
	const removed: string[] = [];
	const executed: string[] = [];
	const events: ScheduledTaskLifecycleLogEvent[] = [];
	const logs: Array<Record<string, unknown>> = [];
	const state = { createCalls: 0, workerStarted: false, closed: false };
	let processJob: ProcessJob | null = null;
	const schedules = [...(options.existingSchedules ?? [])];

	const runScheduledTask = {
		tasks: () => buildScheduledTasks(settings),
		execute: async (taskName: string) => {
			const declared = buildScheduledTasks(settings).some(
				(task) => task.name === taskName,
			);
			if (!declared) throw new UnknownScheduledTaskError(taskName);
			executed.push(taskName);

			return options.execute
				? await options.execute(taskName)
				: { apiStatus: 200, apiRequestId: 'request-1' };
		},
	};

	const adapter = new BullmqScheduledTasksConsumerAdapter(
		{ ...settings, queuesEnabled: options.queuesEnabled ?? true } as never,
		runScheduledTask as never,
		{
			create: () => {
				state.createCalls += 1;

				return {
					upsertSchedule: async (input: { name: string; cron: string }) => {
						upserted.push(input);
						if (!schedules.some((s) => s.name === input.name))
							schedules.push({
								name: input.name,
								cron: input.cron,
								nextRunAt: null,
							});
					},
					listSchedules: async () => schedules,
					removeSchedule: async (name: string) => {
						removed.push(name);
					},
					startWorker: (input: {
						concurrency: number;
						processJob: ProcessJob;
					}) => {
						state.workerStarted = true;
						processJob = input.processJob;
					},
					close: async () => {
						state.closed = true;
					},
				};
			},
		} as never,
		{
			emit: (event: ScheduledTaskLifecycleLogEvent) => {
				events.push(event);
			},
		} as never,
		{
			info: (event: Record<string, unknown>) => {
				logs.push(event);
			},
			error: (event: Record<string, unknown>) => {
				logs.push(event);
			},
		} as never,
	);

	return {
		adapter,
		upserted,
		removed,
		executed,
		events,
		logs,
		state,
		getProcessJob: (): ProcessJob => {
			if (!processJob) throw new Error('Expected a process job handler.');

			return processJob;
		},
	};
};

const jobExecution = (name: string): ScheduledTaskJobExecution => ({
	data: { name },
	jobId: `repeat:${name}:1`,
	attempt: 1,
});

test('arms one schedule per declared task using the configured cron', async () => {
	const scenario = createScenario();

	await scenario.adapter.onApplicationBootstrap();

	assert.deepEqual(scenario.upserted, [
		{ name: 'reconcile_stale_checkouts', cron: '*/10 * * * *' },
		{ name: 'cleanup_expired_order_quotes', cron: '*/15 * * * *' },
	]);
	assert.equal(scenario.state.workerStarted, true);
	assert.deepEqual(scenario.removed, []);
});

test('removes a schedule that is no longer declared in code', async () => {
	const scenario = createScenario({
		existingSchedules: [
			{ name: 'retired_task', cron: '0 * * * *', nextRunAt: null },
		],
	});

	await scenario.adapter.onApplicationBootstrap();

	assert.deepEqual(scenario.removed, ['retired_task']);
	assert.ok(
		scenario.logs.some((log) => log.operation === 'prune_schedule'),
		'expected a prune event',
	);
});

test('bootstrapping twice does not duplicate schedules', async () => {
	const scenario = createScenario();

	await scenario.adapter.onApplicationBootstrap();
	await scenario.adapter.onApplicationShutdown();
	await scenario.adapter.onApplicationBootstrap();

	assert.equal(scenario.upserted.length, 4);
	assert.deepEqual(scenario.removed, []);
});

test('skips all scheduling when queue consumption is disabled', async () => {
	const scenario = createScenario({ queuesEnabled: false });

	await scenario.adapter.onApplicationBootstrap();

	assert.equal(scenario.state.createCalls, 0);
	assert.deepEqual(scenario.upserted, []);
});

test('emits one lifecycle event per run carrying the cron and correlation ids', async () => {
	const scenario = createScenario();
	await scenario.adapter.onApplicationBootstrap();

	await scenario.getProcessJob()(jobExecution('reconcile_stale_checkouts'));

	assert.deepEqual(scenario.executed, ['reconcile_stale_checkouts']);
	assert.equal(scenario.events.length, 1);
	assert.deepEqual(scenario.events[0], {
		event: 'scheduled_task.lifecycle',
		operation: 'run_task',
		outcome: 'success',
		task_name: 'reconcile_stale_checkouts',
		cron: '*/10 * * * *',
		job_id: 'repeat:reconcile_stale_checkouts:1',
		queue_name: 'scheduled-tasks',
		attempt: 1,
		api_status: 200,
		api_request_id: 'request-1',
	});
});

test('rejects an undeclared task name without calling the API', async () => {
	const scenario = createScenario();
	await scenario.adapter.onApplicationBootstrap();

	await assert.rejects(
		scenario.getProcessJob()(jobExecution('drop_all_orders')),
		(error: unknown) => error instanceof UnknownScheduledTaskError,
	);

	assert.deepEqual(scenario.executed, []);
	assert.equal(scenario.events[0]?.outcome, 'error');
	assert.equal(scenario.events[0]?.error_type, 'UnknownScheduledTaskError');
});

test('records the API status when a task fails so a retry is queryable', async () => {
	const scenario = createScenario({
		execute: async () => {
			throw new ScheduledTaskExecutionFailedError('failed with 503', 503);
		},
	});
	await scenario.adapter.onApplicationBootstrap();

	await assert.rejects(
		scenario.getProcessJob()(jobExecution('cleanup_expired_order_quotes')),
	);

	assert.equal(scenario.events[0]?.outcome, 'error');
	assert.equal(scenario.events[0]?.api_status, 503);
	assert.equal(
		scenario.events[0]?.error_type,
		'ScheduledTaskExecutionFailedError',
	);
});

