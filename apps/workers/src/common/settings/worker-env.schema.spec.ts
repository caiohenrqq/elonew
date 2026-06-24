import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWorkerEnv } from '@packages/config/env/worker-env.schema';

test('validateWorkerEnv requires the internal API key', () => {
	assert.throws(
		() =>
			validateWorkerEnv({
				NODE_ENV: 'production',
				API_INTERNAL_BASE_URL: 'http://api:3000',
				REDIS_URL: 'redis://redis:6379',
			}),
		/INTERNAL_API_KEY: Production environment must override the internal API key/,
	);
});
