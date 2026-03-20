import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	InternalApiKeyRequiredError,
	InvalidInternalApiKeyError,
} from '@modules/auth/domain/auth.errors';
import { InternalApiKeyGuard } from '@modules/auth/presentation/guards/internal-api-key.guard';

function createExecutionContext(apiKey?: string) {
	return {
		switchToHttp: () => ({
			getRequest: () => ({
				headers: apiKey === undefined ? {} : { 'x-internal-api-key': apiKey },
			}),
		}),
	} as never;
}

describe('InternalApiKeyGuard', () => {
	it('allows requests with the expected internal api key', () => {
		const appSettings: Pick<AppSettingsService, 'internalApiKey'> = {
			internalApiKey: 'internal-secret',
		};
		const guard = new InternalApiKeyGuard(appSettings);

		expect(guard.canActivate(createExecutionContext('internal-secret'))).toBe(
			true,
		);
	});

	it('throws when the internal api key is missing', () => {
		const appSettings: Pick<AppSettingsService, 'internalApiKey'> = {
			internalApiKey: 'internal-secret',
		};
		const guard = new InternalApiKeyGuard(appSettings);

		expect(() => guard.canActivate(createExecutionContext())).toThrow(
			InternalApiKeyRequiredError,
		);
	});

	it('throws when the internal api key is invalid', () => {
		const appSettings: Pick<AppSettingsService, 'internalApiKey'> = {
			internalApiKey: 'internal-secret',
		};
		const guard = new InternalApiKeyGuard(appSettings);

		expect(() =>
			guard.canActivate(createExecutionContext('wrong-secret')),
		).toThrow(InvalidInternalApiKeyError);
	});
});
