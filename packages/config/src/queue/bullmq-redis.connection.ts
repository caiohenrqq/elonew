export type BullmqRedisConnection = {
	host: string;
	port: number;
	username?: string;
	password?: string;
	db?: number;
	maxRetriesPerRequest: null;
};

export function createBullmqRedisConnection(
	redisUrl: string,
): BullmqRedisConnection {
	const parsed = new URL(redisUrl);

	return {
		host: parsed.hostname,
		port: Number(parsed.port || '6379'),
		username: parsed.username || undefined,
		password: parsed.password || undefined,
		db:
			parsed.pathname && parsed.pathname !== '/'
				? Number(parsed.pathname.slice(1))
				: undefined,
		maxRetriesPerRequest: null,
	};
}
