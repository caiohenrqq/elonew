import { ReadableStream } from 'node:stream/web';
import { getAuthSession, isAccessTokenExpired } from '@/shared/auth/session';

jest.mock('@/shared/auth/session', () => ({
	getAuthSession: jest.fn(),
	isAccessTokenExpired: jest.fn(),
}));

class TestHeaders {
	private readonly values = new Map<string, string>();

	constructor(input?: Record<string, string>) {
		for (const [key, value] of Object.entries(input ?? {})) {
			this.values.set(key.toLowerCase(), value);
		}
	}

	get(name: string): string | null {
		return this.values.get(name.toLowerCase()) ?? null;
	}
}

class TestResponse {
	readonly body: BodyInit | null;
	readonly headers: TestHeaders;
	readonly status: number;

	constructor(body?: BodyInit | null, init?: ResponseInit) {
		this.body = body ?? null;
		this.status = init?.status ?? 200;
		this.headers = new TestHeaders(init?.headers as Record<string, string>);
	}

	get ok(): boolean {
		return this.status >= 200 && this.status < 300;
	}

	static json(body: unknown, init?: ResponseInit): TestResponse {
		return new TestResponse(JSON.stringify(body), {
			...init,
			headers: {
				'content-type': 'application/json',
				...((init?.headers as Record<string, string> | undefined) ?? {}),
			},
		});
	}
}

const getAuthSessionMock = getAuthSession as jest.Mock;
const isAccessTokenExpiredMock = isAccessTokenExpired as jest.Mock;

describe('GET /api/orders/events', () => {
	const originalFetch = global.fetch;
	const originalReadableStream = global.ReadableStream;
	const originalResponse = global.Response;
	let GET: typeof import('./route').GET;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.API_URL = 'http://api.test';
		isAccessTokenExpiredMock.mockReturnValue(false);
		global.ReadableStream =
			ReadableStream as unknown as typeof global.ReadableStream;
		global.Response = TestResponse as unknown as typeof global.Response;
		({ GET } = require('./route') as typeof import('./route'));
	});

	afterEach(() => {
		global.fetch = originalFetch;
		global.ReadableStream = originalReadableStream;
		global.Response = originalResponse;
		delete process.env.API_URL;
	});

	it('returns unauthorized without a session', async () => {
		getAuthSessionMock.mockResolvedValue(null);

		const response = await GET({
			signal: new AbortController().signal,
		} as Request);

		expect(response.status).toBe(200);
		expect(response.body).toBe('event: auth.expired\ndata: {}\n\n');
		expect(global.fetch).toBe(originalFetch);
	});

	it('proxies the API event stream with the server-side access token', async () => {
		const stream = new ReadableStream();
		getAuthSessionMock.mockResolvedValue({
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
			accessTokenExpiresAt: Date.now() + 60_000,
			userId: 'client-1',
			userRole: 'CLIENT',
			username: 'client',
		});
		global.fetch = jest.fn().mockResolvedValue(
			new TestResponse(stream as unknown as BodyInit, {
				status: 200,
				headers: { 'content-type': 'text/event-stream' },
			}),
		);

		const abortController = new AbortController();
		const request = {
			signal: abortController.signal,
		} as Request;
		const response = await GET(request);

		expect(response.status).toBe(200);
		expect(response.body).toBe(stream);
		expect(global.fetch).toHaveBeenCalledWith(
			'http://api.test/orders/events',
			expect.objectContaining({
				headers: {
					authorization: 'Bearer access-token',
					accept: 'text/event-stream',
				},
				signal: abortController.signal,
			}),
		);
	});
});
