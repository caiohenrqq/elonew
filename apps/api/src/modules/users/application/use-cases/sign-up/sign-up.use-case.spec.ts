import type { EmailConfirmationTokenServicePort } from '@modules/users/application/ports/email-confirmation-token.port';
import type { PasswordHasherPort } from '@modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { SignUpUseCase } from '@modules/users/application/use-cases/sign-up/sign-up.use-case';
import { User } from '@modules/users/domain/user.entity';
import {
	UserEmailAlreadyInUseError,
	UsernameAlreadyInUseError,
} from '@modules/users/domain/user.errors';

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
			emailConfirmedAt: user.emailConfirmedAt,
			emailConfirmationTokenHash: user.emailConfirmationTokenHash,
			emailConfirmationTokenExpiresAt: user.emailConfirmationTokenExpiresAt,
			createdAt: new Date('2026-03-11T00:00:00.000Z'),
			updatedAt: new Date('2026-03-11T00:00:00.000Z'),
		});

		this.users.set(createdUser.id, createdUser);

		return createdUser;
	}

	async save(user: User): Promise<void> {
		this.users.set(user.id, user);
	}
}

describe('SignUpUseCase', () => {
	it('creates an inactive user with a hashed password and confirmation preview token', async () => {
		const repository = new InMemoryUserRepository();
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn().mockResolvedValue('hashed-password'),
		};
		const emailConfirmationTokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn().mockReturnValue({
				rawToken: 'preview-token',
				tokenHash: 'token-hash',
				expiresAt: new Date('2026-12-31T01:00:00.000Z'),
			}),
			hash: jest.fn(),
		};
		const useCase = new SignUpUseCase(
			repository,
			passwordHasher,
			emailConfirmationTokenService,
		);

		const createdUser = await useCase.execute({
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'Secret123!',
		});

		expect(createdUser).toMatchObject({
			id: expect.any(String),
			username: 'summoner1',
			email: 'summoner1@example.com',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationPreviewToken: 'preview-token',
		});

		const persistedUser = await repository.findById(createdUser.id);
		expect(persistedUser).toMatchObject({
			id: createdUser.id,
			username: 'summoner1',
			email: 'summoner1@example.com',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationTokenHash: 'token-hash',
			emailConfirmationTokenExpiresAt: new Date('2026-12-31T01:00:00.000Z'),
		});
		expect(persistedUser?.passwordHash).toBe('hashed-password');
	});

	it('rejects sign-up when the email is already in use', async () => {
		const repository = new InMemoryUserRepository();
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn().mockResolvedValue('hashed-password'),
		};
		const emailConfirmationTokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn().mockReturnValue({
				rawToken: 'preview-token',
				tokenHash: 'token-hash',
				expiresAt: new Date('2026-12-31T01:00:00.000Z'),
			}),
			hash: jest.fn(),
		};
		const useCase = new SignUpUseCase(
			repository,
			passwordHasher,
			emailConfirmationTokenService,
		);

		await useCase.execute({
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'Secret123!',
		});

		await expect(
			useCase.execute({
				username: 'summoner2',
				email: 'summoner1@example.com',
				password: 'Secret456!',
			}),
		).rejects.toBeInstanceOf(UserEmailAlreadyInUseError);
	});

	it('rejects sign-up when the username is already in use', async () => {
		const repository = new InMemoryUserRepository();
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn().mockResolvedValue('hashed-password'),
		};
		const emailConfirmationTokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn().mockReturnValue({
				rawToken: 'preview-token',
				tokenHash: 'token-hash',
				expiresAt: new Date('2026-12-31T01:00:00.000Z'),
			}),
			hash: jest.fn(),
		};
		const useCase = new SignUpUseCase(
			repository,
			passwordHasher,
			emailConfirmationTokenService,
		);

		await useCase.execute({
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'Secret123!',
		});

		await expect(
			useCase.execute({
				username: 'summoner1',
				email: 'summoner2@example.com',
				password: 'Secret456!',
			}),
		).rejects.toBeInstanceOf(UsernameAlreadyInUseError);
	});
});
