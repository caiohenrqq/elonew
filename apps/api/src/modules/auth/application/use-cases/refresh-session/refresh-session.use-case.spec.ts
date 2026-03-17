import type { AuthSessionRepositoryPort } from '@modules/auth/application/ports/auth-session-repository.port';
import type {
	AccessTokenServicePort,
	RefreshTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import { RefreshSessionUseCase } from '@modules/auth/application/use-cases/refresh-session/refresh-session.use-case';
import {
	AuthRefreshTokenInvalidError,
	AuthRefreshTokenRevokedError,
} from '@modules/auth/domain/auth.errors';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import { Role } from '@packages/auth/roles/role';

class InMemoryUserRepository implements UserRepositoryPort {
	private readonly users = new Map<string, User>();

	async findById(id: string): Promise<User | null> {
		return this.users.get(id) ?? null;
	}

	async findByEmail(): Promise<User | null> {
		return null;
	}

	async findByUsername(): Promise<User | null> {
		return null;
	}

	async findByEmailConfirmationTokenHash(): Promise<User | null> {
		return null;
	}

	async create(user: User): Promise<User> {
		this.users.set(user.id, user);
		return user;
	}

	async save(user: User): Promise<void> {
		this.users.set(user.id, user);
	}
}

class InMemoryAuthSessionRepository implements AuthSessionRepositoryPort {
	findByRefreshTokenHash = jest.fn();
	create = jest.fn();
	save = jest.fn();
}

describe('RefreshSessionUseCase', () => {
	it('rotates a valid refresh token and rejects the previous token afterwards', async () => {
		const users = new InMemoryUserRepository();
		await users.create(
			User.rehydrate({
				id: 'user-1',
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				role: Role.CLIENT,
				isActive: true,
				emailConfirmedAt: new Date('2026-03-16T00:00:00.000Z'),
				emailConfirmationTokenHash: null,
				emailConfirmationTokenExpiresAt: null,
				createdAt: new Date('2026-03-16T00:00:00.000Z'),
				updatedAt: new Date('2026-03-16T00:00:00.000Z'),
			}),
		);
		const authSessions = new InMemoryAuthSessionRepository();
		authSessions.findByRefreshTokenHash
			.mockResolvedValueOnce({
				id: 'session-1',
				userId: 'user-1',
				refreshTokenHash: 'current-hash',
				expiresAt: new Date('2026-03-24T00:00:00.000Z'),
				revokedAt: null,
				lastUsedAt: null,
				createdAt: new Date('2026-03-17T00:00:00.000Z'),
				updatedAt: new Date('2026-03-17T00:00:00.000Z'),
			})
			.mockResolvedValueOnce(null);
		const accessTokenService: AccessTokenServicePort = {
			sign: jest.fn().mockReturnValue({
				token: 'next-access-token',
				expiresInSeconds: 900,
			}),
		};
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn().mockReturnValue({
				rawToken: 'next-refresh-token',
				tokenHash: 'next-hash',
				expiresAt: new Date('2026-03-25T00:00:00.000Z'),
			}),
			hash: jest
				.fn()
				.mockReturnValueOnce('current-hash')
				.mockReturnValueOnce('current-hash'),
		};
		const useCase = new RefreshSessionUseCase(
			users,
			authSessions,
			accessTokenService,
			refreshTokenService,
		);

		await expect(
			useCase.execute({
				refreshToken: 'current-refresh-token',
			}),
		).resolves.toEqual({
			accessToken: 'next-access-token',
			refreshToken: 'next-refresh-token',
			expiresInSeconds: 900,
			user: {
				id: 'user-1',
				username: 'summoner1',
				email: 'summoner1@example.com',
				role: 'CLIENT',
				isActive: true,
			},
		});
		expect(authSessions.save).toHaveBeenCalled();

		await expect(
			useCase.execute({
				refreshToken: 'current-refresh-token',
			}),
		).rejects.toBeInstanceOf(AuthRefreshTokenInvalidError);
	});

	it('rejects revoked refresh sessions', async () => {
		const users = new InMemoryUserRepository();
		const authSessions = new InMemoryAuthSessionRepository();
		authSessions.findByRefreshTokenHash.mockResolvedValue({
			id: 'session-1',
			userId: 'user-1',
			refreshTokenHash: 'current-hash',
			expiresAt: new Date('2026-03-24T00:00:00.000Z'),
			revokedAt: new Date('2026-03-18T00:00:00.000Z'),
			lastUsedAt: null,
			createdAt: new Date('2026-03-17T00:00:00.000Z'),
			updatedAt: new Date('2026-03-18T00:00:00.000Z'),
		});
		const accessTokenService: AccessTokenServicePort = {
			sign: jest.fn(),
		};
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('current-hash'),
		};
		const useCase = new RefreshSessionUseCase(
			users,
			authSessions,
			accessTokenService,
			refreshTokenService,
		);

		await expect(
			useCase.execute({
				refreshToken: 'current-refresh-token',
			}),
		).rejects.toBeInstanceOf(AuthRefreshTokenRevokedError);
	});
});
