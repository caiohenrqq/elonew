import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkerApp } from './worker-app.factory';

test('createWorkerApp bootstraps the Nest application context in test mode', async () => {
	const originalNodeEnv = process.env.NODE_ENV;

	process.env.NODE_ENV = 'test';

	const app = await createWorkerApp({ logger: false });

	try {
		assert.ok(app);
	} finally {
		await app.close();

		if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
		else process.env.NODE_ENV = originalNodeEnv;
	}
});
