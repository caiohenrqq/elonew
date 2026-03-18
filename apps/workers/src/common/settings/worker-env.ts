import {
	DEFAULT_API_INTERNAL_BASE_URL,
	DEFAULT_REDIS_URL,
	DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
	DEFAULT_WORKER_CONCURRENCY,
} from '@packages/config/env/wallet-funds-release.config';

export type WorkerEnv = {
	NODE_ENV: 'development' | 'test' | 'production';
	API_INTERNAL_BASE_URL: string;
	REDIS_URL: string;
	WALLET_FUNDS_RELEASE_QUEUE_NAME: string;
	WORKER_CONCURRENCY: number;
};

function getString(
	config: Record<string, unknown>,
	key: keyof WorkerEnv,
	fallback: string,
): string {
	const value = config[key];
	if (typeof value !== 'string') return fallback;

	const trimmed = value.trim();
	return trimmed || fallback;
}

function getNodeEnv(config: Record<string, unknown>): WorkerEnv['NODE_ENV'] {
	const value = getString(config, 'NODE_ENV', 'development');
	if (value === 'development' || value === 'test' || value === 'production')
		return value;

	throw new Error(
		'Env validation failed:\nNODE_ENV: must be development, test, or production',
	);
}

function getPositiveInt(
	config: Record<string, unknown>,
	key: keyof WorkerEnv,
	fallback: number,
): number {
	const raw = config[key];
	const value =
		typeof raw === 'number'
			? raw
			: Number.parseInt(typeof raw === 'string' ? raw : String(fallback), 10);

	if (Number.isInteger(value) && value > 0) return value;

	throw new Error(
		`Env validation failed:\n${String(key)}: must be a positive integer`,
	);
}

export function validateWorkerEnv(config: Record<string, unknown>): WorkerEnv {
	return {
		NODE_ENV: getNodeEnv(config),
		API_INTERNAL_BASE_URL: getString(
			config,
			'API_INTERNAL_BASE_URL',
			DEFAULT_API_INTERNAL_BASE_URL,
		),
		REDIS_URL: getString(config, 'REDIS_URL', DEFAULT_REDIS_URL),
		WALLET_FUNDS_RELEASE_QUEUE_NAME: getString(
			config,
			'WALLET_FUNDS_RELEASE_QUEUE_NAME',
			DEFAULT_WALLET_FUNDS_RELEASE_QUEUE_NAME,
		),
		WORKER_CONCURRENCY: getPositiveInt(
			config,
			'WORKER_CONCURRENCY',
			DEFAULT_WORKER_CONCURRENCY,
		),
	};
}
