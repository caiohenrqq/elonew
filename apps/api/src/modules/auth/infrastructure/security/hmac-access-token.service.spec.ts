import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import { InvalidAccessTokenError } from '@modules/auth/domain/auth.errors';
import { HmacAccessTokenService } from '@modules/auth/infrastructure/security/hmac-access-token.service';
import { Role } from '@packages/auth/roles/role';

const appSettings = {
	jwtAccessTokenSecret: 'test-secret',
	jwtAccessTokenTtlMinutes: 15,
} as AppSettingsService;

describe('HmacAccessTokenService', () => {
	it('verifies tokens signed by the access token service', () => {
		const service = new HmacAccessTokenService(appSettings);
		const token = service.sign({
			userId: 'client-1',
			role: Role.CLIENT,
		});

		expect(service.verify(token.token)).toEqual({
			id: 'client-1',
			role: Role.CLIENT,
		});
	});

	it('rejects tampered tokens', () => {
		const service = new HmacAccessTokenService(appSettings);
		const token = service.sign({
			userId: 'client-1',
			role: Role.CLIENT,
		});
		const [header, payload] = token.token.split('.');

		expect(() => service.verify(`${header}.${payload}.tampered`)).toThrow(
			InvalidAccessTokenError,
		);
	});
});
