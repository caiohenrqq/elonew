jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/headers', () => ({
	cookies: jest.fn(),
}));

import { getAuthSessionCookieOptions } from './session';

describe('auth session cookie options', () => {
	const originalNodeEnv = process.env.NODE_ENV;
	const originalCookieDomain = process.env.WEB_SESSION_COOKIE_DOMAIN;

	afterEach(() => {
		(process.env as Record<string, string | undefined>).NODE_ENV =
			originalNodeEnv;
		process.env.WEB_SESSION_COOKIE_DOMAIN = originalCookieDomain;
	});

	it('keeps development cookies host-only', () => {
		(process.env as Record<string, string | undefined>).NODE_ENV =
			'development';
		delete process.env.WEB_SESSION_COOKIE_DOMAIN;

		expect(getAuthSessionCookieOptions()).toMatchObject({
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: false,
		});
		expect(getAuthSessionCookieOptions()).not.toHaveProperty('domain');
	});

	it('uses the configured production cookie domain for cross-subdomain sockets', () => {
		(process.env as Record<string, string | undefined>).NODE_ENV = 'production';
		process.env.WEB_SESSION_COOKIE_DOMAIN = ' .elonew.com ';

		expect(getAuthSessionCookieOptions()).toMatchObject({
			domain: '.elonew.com',
			secure: true,
		});
	});
});
