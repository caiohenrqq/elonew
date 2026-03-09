type WorkerEnv = {
	apiBaseUrl: string;
	releaseIntervalMs: number;
};

function getRequiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`Missing required env var: ${name}`);

	return value;
}

function getWorkerEnv(): WorkerEnv {
	const apiBaseUrl = getRequiredEnv('API_INTERNAL_BASE_URL');
	const releaseIntervalMs = Number.parseInt(
		process.env.WALLET_RELEASE_INTERVAL_MS ?? '60000',
		10,
	);

	if (!Number.isFinite(releaseIntervalMs) || releaseIntervalMs <= 0)
		throw new Error('WALLET_RELEASE_INTERVAL_MS must be a positive integer.');

	return {
		apiBaseUrl,
		releaseIntervalMs,
	};
}

async function triggerWalletRelease(apiBaseUrl: string): Promise<void> {
	const response = await fetch(
		`${apiBaseUrl}/wallets/internal/release-matured-funds`,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				now: new Date().toISOString(),
			}),
		},
	);

	if (!response.ok)
		throw new Error(
			`Wallet release request failed with status ${response.status}.`,
		);
}

async function bootstrap() {
	const env = getWorkerEnv();

	await triggerWalletRelease(env.apiBaseUrl);
	console.log('Workers runtime initialized.');

	setInterval(() => {
		void triggerWalletRelease(env.apiBaseUrl).catch((error: Error) => {
			console.error('Wallet release trigger failed.', error);
		});
	}, env.releaseIntervalMs);
}

void bootstrap();
