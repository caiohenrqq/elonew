import type { AuthSessionRepositoryPort } from '@modules/auth/application/ports/auth-session-repository.port';
import type { RefreshTokenServicePort } from '@modules/auth/application/ports/token-service.port';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout/logout.use-case';
import { AuthRefreshTokenInvalidError } from '@modules/auth/domain/auth.errors';

class InMemoryAuthSessionRepository implements AuthSessionRepositoryPort {
	findByRefreshTokenHash = jest.fn();
	create = jest.fn();
	save = jest.fn();
}

describe('LogoutUseCase', () => {
	it('revokes the refresh session for a valid refresh token', async () => {
		const authSessions = new InMemoryAuthSessionRepository();
		authSessions.findByRefreshTokenHash.mockResolvedValue({
			id: 'session-1',
			userId: 'user-1',
			refreshTokenHash: 'current-hash',
			expiresAt: new Date('2026-03-24T00:00:00.000Z'),
			revokedAt: null,
			lastUsedAt: null,
			createdAt: new Date('2026-03-17T00:00:00.000Z'),
			updatedAt: new Date('2026-03-17T00:00:00.000Z'),
		});
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('current-hash'),
		};
		const useCase = new LogoutUseCase(authSessions, refreshTokenService);

		await expect(
			useCase.execute({
				refreshToken: 'current-refresh-token',
			}),
		).resolves.toEqual({ success: true });
		expect(authSessions.save).toHaveBeenCalled();
	});

	it('rejects invalid refresh tokens', async () => {
		const authSessions = new InMemoryAuthSessionRepository();
		authSessions.findByRefreshTokenHash.mockResolvedValue(null);
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('missing-hash'),
		};
		const useCase = new LogoutUseCase(authSessions, refreshTokenService);

		await expect(
			useCase.execute({
				refreshToken: 'missing-refresh-token',
			}),
		).rejects.toBeInstanceOf(AuthRefreshTokenInvalidError);
	});
});
