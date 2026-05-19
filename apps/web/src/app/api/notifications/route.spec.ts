jest.mock('@/shared/api-client-management/api-client', () => ({
	api: {
		request: jest.fn(),
	},
}));

import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';

const apiRequestMock = jest.mocked(api.request);
const originalResponse = global.Response;
let GET: typeof import('./route').GET;

class TestResponse {
	readonly body: string | null;
	readonly status: number;

	constructor(body?: string | null, init?: ResponseInit) {
		this.body = body ?? null;
		this.status = init?.status ?? 200;
	}

	async json(): Promise<unknown> {
		return this.body ? JSON.parse(this.body) : null;
	}

	static json(body: unknown, init?: ResponseInit): TestResponse {
		return new TestResponse(JSON.stringify(body), init);
	}
}

const responsePayload = {
	items: [],
	nextCursor: null,
	unreadCount: 0,
};

describe('notifications BFF route', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.Response = TestResponse as unknown as typeof global.Response;
		({ GET } = require('./route') as typeof import('./route'));
	});

	afterEach(() => {
		global.Response = originalResponse;
	});

	it('returns authenticated notification state without exposing tokens', async () => {
		apiRequestMock.mockResolvedValue(responsePayload);

		const response = await GET();

		await expect(response.json()).resolves.toEqual(responsePayload);
		expect(apiRequestMock).toHaveBeenCalledWith('/notifications?limit=10', {
			auth: true,
		});
	});

	it('maps API auth failures to the browser route status', async () => {
		apiRequestMock.mockRejectedValue(
			new ApiRequestError(401, { message: 'Entre novamente.' }),
		);

		const response = await GET();

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			message: 'Entre novamente.',
		});
	});
});
