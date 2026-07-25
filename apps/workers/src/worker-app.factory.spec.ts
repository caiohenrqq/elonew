import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkerApp } from './worker-app.factory';

// WORKER_QUEUES_ENABLED=false is set by the test script, so bootstrapping here
// must not reach Redis.
test('createWorkerApp bootstraps the Nest application context', async () => {
	const app = await createWorkerApp({ logger: false });

	try {
		assert.ok(app);
	} finally {
		await app.close();
	}
});
