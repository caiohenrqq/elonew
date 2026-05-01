import { isAllowedOrigin } from './origin';

describe('isAllowedOrigin', () => {
	it('allows same-origin mutation requests', () => {
		expect(
			isAllowedOrigin({
				origin: 'https://app.elonew.com',
				host: 'app.elonew.com',
				appUrl: 'https://app.elonew.com',
			}),
		).toBe(true);
	});

	it('rejects cross-origin mutation requests', () => {
		expect(
			isAllowedOrigin({
				origin: 'https://evil.example',
				host: 'app.elonew.com',
				appUrl: 'https://app.elonew.com',
			}),
		).toBe(false);
	});

	it('uses forwarded host when the application is behind a proxy', () => {
		expect(
			isAllowedOrigin({
				origin: 'https://app.elonew.com',
				host: 'internal:3001',
				forwardedHost: 'app.elonew.com',
				appUrl: 'https://app.elonew.com',
			}),
		).toBe(true);
	});
});
