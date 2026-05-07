import type { AuthSessionRepositoryPort } from '@modules/auth/application/ports/auth-session-repository.port';
import type {
	AccessTokenServicePort,
	RefreshTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import { LoginUseCase } from '@modules/auth/application/use-cases/login/login.use-case';
import {
	AuthInvalidCredentialsError,
	AuthUserBlockedError,
	AuthUserInactiveError,
} from '@modules/auth/domain/auth.errors';
import type { PasswordHasherPort } from '@modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import { Role } from '@packages/auth/roles/role';

class InMemoryUserRepository implements UserRepositoryPort {
	private readonly users = new Map<string, User>();
	private nextId = 1;

	async findById(id: string): Promise<User | null> {
		return this.users.get(id) ?? null;
	}

	async findByEmail(email: string): Promise<User | null> {
		return (
			[...this.users.values()].find((user) => user.email === email) ?? null
		);
	}

	async findByUsername(username: string): Promise<User | null> {
		return (
			[...this.users.values()].find((user) => user.username === username) ??
			null
		);
	}

	async findByEmailConfirmationTokenHash(
		tokenHash: string,
	): Promise<User | null> {
		return (
			[...this.users.values()].find(
				(user) => user.emailConfirmationTokenHash === tokenHash,
			) ?? null
		);
	}

	async create(user: User): Promise<User> {
		const createdUser = User.rehydrate({
			id: `user-${this.nextId++}`,
			username: user.username,
			email: user.email,
			passwordHash: user.passwordHash,
			role: user.role,
			isActive: user.isActive,
			isBlocked: user.isBlocked,
			emailConfirmedAt: user.emailConfirmedAt,
			emailConfirmationTokenHash: user.emailConfirmationTokenHash,
			emailConfirmationTokenExpiresAt: user.emailConfirmationTokenExpiresAt,
			createdAt: new Date('2026-03-17T00:00:00.000Z'),
			updatedAt: new Date('2026-03-17T00:00:00.000Z'),
		});
		this.users.set(createdUser.id, createdUser);

		return createdUser;
	}

	async save(user: User): Promise<void> {
		this.users.set(user.id, user);
	}
}

class InMemoryAuthSessionRepository implements AuthSessionRepositoryPort {
	create = jest.fn();
	findByRefreshTokenHash = jest.fn();
	save = jest.fn();
}

describe('LoginUseCase', () => {
	it('logs in an active user and returns an access token plus refresh token', async () => {
		const users = new InMemoryUserRepository();
		const activeUser = await users.create(
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
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn(),
			verify: jest.fn().mockResolvedValue(true),
		};
		const authSessions = new InMemoryAuthSessionRepository();
		authSessions.create.mockResolvedValue({
			id: 'session-1',
			userId: activeUser.id,
			refreshTokenHash: 'refresh-hash',
			expiresAt: new Date('2026-03-24T00:00:00.000Z'),
			revokedAt: null,
			lastUsedAt: null,
			createdAt: new Date('2026-03-17T00:00:00.000Z'),
			updatedAt: new Date('2026-03-17T00:00:00.000Z'),
		});
		const accessTokenService: AccessTokenServicePort = {
			sign: jest.fn().mockReturnValue({
				token: 'access-token',
				expiresInSeconds: 900,
			}),
		};
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn().mockReturnValue({
				rawToken: 'refresh-token',
				tokenHash: 'refresh-hash',
				expiresAt: new Date('2026-03-24T00:00:00.000Z'),
			}),
			hash: jest.fn(),
		};
		const useCase = new LoginUseCase(
			users,
			passwordHasher,
			authSessions,
			accessTokenService,
			refreshTokenService,
		);

		await expect(
			useCase.execute({
				email: ' Summoner1@Example.com ',
				password: 'Secret123456!',
			}),
		).resolves.toEqual({
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
			expiresInSeconds: 900,
			user: {
				id: activeUser.id,
				username: 'summoner1',
				email: 'summoner1@example.com',
				role: 'CLIENT',
				isActive: true,
			},
		});
		expect(passwordHasher.verify).toHaveBeenCalledWith(
			'Secret123456!',
			'hashed-password',
		);
		expect(authSessions.create).toHaveBeenCalled();
	});

	it('rejects invalid credentials', async () => {
		const users = new InMemoryUserRepository();
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn(),
			verify: jest.fn().mockResolvedValue(false),
		};
		const authSessions = new InMemoryAuthSessionRepository();
		const accessTokenService: AccessTokenServicePort = {
			sign: jest.fn(),
		};
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn(),
		};
		const useCase = new LoginUseCase(
			users,
			passwordHasher,
			authSessions,
			accessTokenService,
			refreshTokenService,
		);

		await expect(
			useCase.execute({
				email: 'missing@example.com',
				password: 'Secret123456!',
			}),
		).rejects.toBeInstanceOf(AuthInvalidCredentialsError);
	});

	it('rejects inactive users', async () => {
		const users = new InMemoryUserRepository();
		await users.create(
			User.createPending({
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				emailConfirmationTokenHash: 'token-hash',
				emailConfirmationTokenExpiresAt: new Date('2026-03-18T00:00:00.000Z'),
			}),
		);
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn(),
			verify: jest.fn().mockResolvedValue(true),
		};
		const authSessions = new InMemoryAuthSessionRepository();
		const accessTokenService: AccessTokenServicePort = {
			sign: jest.fn(),
		};
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn(),
		};
		const useCase = new LoginUseCase(
			users,
			passwordHasher,
			authSessions,
			accessTokenService,
			refreshTokenService,
		);

		await expect(
			useCase.execute({
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			}),
		).rejects.toBeInstanceOf(AuthUserInactiveError);
	});

	it('rejects blocked users', async () => {
		const users = new InMemoryUserRepository();
		await users.create(
			User.rehydrate({
				id: 'user-1',
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				role: Role.CLIENT,
				isActive: true,
				isBlocked: true,
				emailConfirmedAt: new Date('2026-03-16T00:00:00.000Z'),
				emailConfirmationTokenHash: null,
				emailConfirmationTokenExpiresAt: null,
				createdAt: new Date('2026-03-16T00:00:00.000Z'),
				updatedAt: new Date('2026-03-16T00:00:00.000Z'),
			}),
		);
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn(),
			verify: jest.fn().mockResolvedValue(true),
		};
		const authSessions = new InMemoryAuthSessionRepository();
		const accessTokenService: AccessTokenServicePort = {
			sign: jest.fn(),
		};
		const refreshTokenService: RefreshTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn(),
		};
		const useCase = new LoginUseCase(
			users,
			passwordHasher,
			authSessions,
			accessTokenService,
			refreshTokenService,
		);

		await expect(
			useCase.execute({
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			}),
		).rejects.toBeInstanceOf(AuthUserBlockedError);
		expect(authSessions.create).not.toHaveBeenCalled();
	});
});
