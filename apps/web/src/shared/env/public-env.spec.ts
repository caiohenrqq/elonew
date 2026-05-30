import { getPublicApiBaseUrl } from './public-env';

describe('public web env', () => {
	const originalEnv = { ...process.env };
	const setNodeEnv = (value: typeof process.env.NODE_ENV) => {
		(process.env as Record<string, string | undefined>).NODE_ENV = value;
	};

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('keeps the local public API default outside production', () => {
		setNodeEnv('development');
		delete process.env.NEXT_PUBLIC_API_URL;

		expect(getPublicApiBaseUrl()).toBe('http://localhost:3000');
	});

	it('trims the configured public API URL', () => {
		setNodeEnv('production');
		process.env.NEXT_PUBLIC_API_URL = ' https://api.elonew.com/ ';

		expect(getPublicApiBaseUrl()).toBe('https://api.elonew.com');
	});

	it('fails fast when production public API URL is missing', () => {
		setNodeEnv('production');
		delete process.env.NEXT_PUBLIC_API_URL;

		expect(() => getPublicApiBaseUrl()).toThrow(
			'Public web env validation failed:\nNEXT_PUBLIC_API_URL: NEXT_PUBLIC_API_URL is required in production.',
		);
	});
});
