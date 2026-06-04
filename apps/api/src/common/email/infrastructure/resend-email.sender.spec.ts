import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { ResendEmailSender } from './resend-email.sender';

describe('ResendEmailSender', () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it('skips delivery when the Resend API key is not configured', async () => {
		const fetchMock = jest.fn();
		global.fetch = fetchMock as unknown as typeof fetch;
		const appSettings = {
			emailFrom: 'onboarding@resend.dev',
			resendApiKey: undefined,
		} as unknown as AppSettingsService;
		const sender = new ResendEmailSender(appSettings);

		await sender.send({
			to: 'summoner@example.com',
			subject: 'Hello',
			html: '<p>Hello</p>',
		});

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('skips delivery while the placeholder Resend API key is still configured', async () => {
		const fetchMock = jest.fn();
		global.fetch = fetchMock as unknown as typeof fetch;
		const appSettings = {
			emailFrom: 'onboarding@resend.dev',
			resendApiKey: 're_xxxxxxxxx',
		} as unknown as AppSettingsService;
		const sender = new ResendEmailSender(appSettings);

		await sender.send({
			to: 'summoner@example.com',
			subject: 'Hello',
			html: '<p>Hello</p>',
		});

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('sends email through the Resend API', async () => {
		const fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		global.fetch = fetchMock as unknown as typeof fetch;
		const appSettings = {
			emailFrom: 'onboarding@resend.dev',
			resendApiKey: 're_test_key',
		} as unknown as AppSettingsService;
		const sender = new ResendEmailSender(appSettings);

		await sender.send({
			to: 'summoner@example.com',
			subject: 'Hello',
			html: '<p>Hello</p>',
			text: 'Hello',
		});

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.resend.com/emails',
			expect.objectContaining({
				method: 'POST',
				headers: {
					Authorization: 'Bearer re_test_key',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: 'onboarding@resend.dev',
					to: 'summoner@example.com',
					subject: 'Hello',
					html: '<p>Hello</p>',
					text: 'Hello',
				}),
			}),
		);
	});

	it('throws when Resend rejects the email request', async () => {
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 401,
		}) as unknown as typeof fetch;
		const appSettings = {
			emailFrom: 'onboarding@resend.dev',
			resendApiKey: 're_test_key',
		} as unknown as AppSettingsService;
		const sender = new ResendEmailSender(appSettings);

		await expect(
			sender.send({
				to: 'summoner@example.com',
				subject: 'Hello',
				html: '<p>Hello</p>',
			}),
		).rejects.toThrow('Resend email delivery failed with 401.');
	});
});
