jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/shared/auth/session', () => ({
	clearAuthSession: jest.fn(),
	getAuthSession: jest.fn(),
	isAccessTokenExpired: jest.fn(),
	setAuthSession: jest.fn(),
}));

import {
	clearAuthSession,
	getAuthSession,
	isAccessTokenExpired,
} from '@/shared/auth/session';
import { api } from './api-client';
import { ApiRequestError } from './http';

const mockedGetAuthSession = jest.mocked(getAuthSession);
const mockedIsAccessTokenExpired = jest.mocked(isAccessTokenExpired);
const mockedClearAuthSession = jest.mocked(clearAuthSession);

describe('api client', () => {
	const originalNodeEnv = process.env.NODE_ENV;
	const setNodeEnv = (value: typeof process.env.NODE_ENV) => {
		(process.env as Record<string, string | undefined>).NODE_ENV = value;
	};

	beforeEach(() => {
		jest.clearAllMocks();
		setNodeEnv(originalNodeEnv);
		process.env.API_URL = 'http://api.test';
	});

	afterEach(() => {
		setNodeEnv(originalNodeEnv);
	});

	it('clears stale sessions and raises an auth error when refresh fetch fails', async () => {
		mockedGetAuthSession.mockResolvedValue({
			accessToken: 'expired-token',
			refreshToken: 'refresh-token',
			accessTokenExpiresAt: Date.now() - 1000,
			userId: 'user-1',
			userRole: 'CLIENT',
			username: 'client',
		});
		mockedIsAccessTokenExpired.mockReturnValue(true);
		global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

		await expect(api.request('/orders', { auth: true })).rejects.toMatchObject({
			status: 401,
		} satisfies Partial<ApiRequestError>);
		expect(mockedClearAuthSession).toHaveBeenCalledTimes(1);
	});

	it('fails fast when API_URL is missing in production', async () => {
		setNodeEnv('production');
		delete process.env.API_URL;
		mockedGetAuthSession.mockResolvedValue(null);

		await expect(api.request('/health')).rejects.toThrow(
			'API_URL is required in production.',
		);
	});
});
