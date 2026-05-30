import {
	getWebApiBaseUrl,
	getWebAppUrl,
	getWebSessionCookieDomain,
	getWebSessionSecret,
} from './web-env';

describe('web env', () => {
	const originalEnv = { ...process.env };
	const setNodeEnv = (value: typeof process.env.NODE_ENV) => {
		(process.env as Record<string, string | undefined>).NODE_ENV = value;
	};

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('keeps local defaults outside production', () => {
		setNodeEnv('development');
		delete process.env.API_URL;
		delete process.env.NEXT_PUBLIC_APP_URL;

		expect(getWebApiBaseUrl()).toBe('http://localhost:3000');
		expect(getWebAppUrl()).toBeUndefined();
	});

	it('trims configured URL and cookie-domain values', () => {
		setNodeEnv('production');
		process.env.API_URL = ' https://api.elonew.com/ ';
		process.env.NEXT_PUBLIC_API_URL = 'https://api.elonew.com';
		process.env.NEXT_PUBLIC_APP_URL = 'https://app.elonew.com';
		process.env.WEB_SESSION_SECRET = 'a'.repeat(32);
		process.env.WEB_SESSION_COOKIE_DOMAIN = ' .elonew.com ';

		expect(getWebApiBaseUrl()).toBe('https://api.elonew.com');
		expect(getWebSessionCookieDomain()).toBe('.elonew.com');
	});

	it('fails fast when production server env is incomplete', () => {
		setNodeEnv('production');
		delete process.env.API_URL;
		delete process.env.NEXT_PUBLIC_API_URL;
		delete process.env.NEXT_PUBLIC_APP_URL;

		expect(() => getWebApiBaseUrl()).toThrow(
			'API_URL is required in production.',
		);
		expect(() => getWebAppUrl()).toThrow(
			'NEXT_PUBLIC_APP_URL is required in production.',
		);
	});

	it('validates malformed production server env values', () => {
		setNodeEnv('production');
		process.env.API_URL = 'not-a-url';
		process.env.WEB_SESSION_SECRET = 'short';
		process.env.WEB_SESSION_COOKIE_DOMAIN = 'not a domain';

		expect(() => getWebApiBaseUrl()).toThrow('Web env validation failed:');
		expect(() => getWebApiBaseUrl()).toThrow('API_URL');
		expect(() => getWebApiBaseUrl()).toThrow('WEB_SESSION_SECRET');
		expect(() => getWebApiBaseUrl()).toThrow('WEB_SESSION_COOKIE_DOMAIN');
	});

	it('requires the session secret when reading sealed sessions', () => {
		setNodeEnv('development');
		delete process.env.WEB_SESSION_SECRET;

		expect(() => getWebSessionSecret()).toThrow(
			'WEB_SESSION_SECRET is required.',
		);
	});
});
