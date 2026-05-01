import {
	type SealedSessionPayload,
	sealSessionPayload,
	unsealSessionPayload,
} from './session-seal';

const secret = 'test-secret-that-is-long-enough-for-session-sealing';

const payload: SealedSessionPayload = {
	accessToken: 'access-token',
	refreshToken: 'refresh-token',
	accessTokenExpiresAt: 1_800_000_000_000,
	userRole: 'CLIENT',
};

describe('session sealing', () => {
	it('round-trips an encrypted session payload', () => {
		const sealed = sealSessionPayload(payload, secret);

		expect(sealed).not.toContain(payload.accessToken);
		expect(sealed).not.toContain(payload.refreshToken);
		expect(unsealSessionPayload(sealed, secret)).toEqual(payload);
	});

	it('rejects tampered session cookies', () => {
		const sealed = sealSessionPayload(payload, secret);
		const parts = sealed.split('.');
		const ciphertext = parts[3];
		parts[3] = `${ciphertext?.startsWith('a') ? 'b' : 'a'}${ciphertext?.slice(1)}`;

		expect(unsealSessionPayload(parts.join('.'), secret)).toBeNull();
	});
});
