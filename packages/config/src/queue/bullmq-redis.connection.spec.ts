import assert from 'node:assert/strict';
import test from 'node:test';
import { createBullmqRedisConnection } from './bullmq-redis.connection';

test('createBullmqRedisConnection parses Redis URL credentials and database index for BullMQ', () => {
	assert.deepEqual(
		createBullmqRedisConnection('redis://worker:secret@redis.internal:6380/4'),
		{
			host: 'redis.internal',
			port: 6380,
			username: 'worker',
			password: 'secret',
			db: 4,
			maxRetriesPerRequest: null,
		},
	);
});

test('createBullmqRedisConnection falls back to the default Redis port when omitted', () => {
	assert.deepEqual(createBullmqRedisConnection('redis://localhost'), {
		host: 'localhost',
		port: 6379,
		username: undefined,
		password: undefined,
		db: undefined,
		maxRetriesPerRequest: null,
	});
});
