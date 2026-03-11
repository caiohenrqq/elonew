import type { EmailConfirmationTokenServicePort } from '@modules/users/application/ports/email-confirmation-token.port';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { ConfirmEmailUseCase } from '@modules/users/application/use-cases/confirm-email/confirm-email.use-case';
import { User } from '@modules/users/domain/user.entity';
import { UserEmailConfirmationTokenInvalidError } from '@modules/users/domain/user.errors';

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

describe('ConfirmEmailUseCase', () => {
	it('activates a pending user when the confirmation token is valid', async () => {
		const repository = new InMemoryUserRepository();
		const pendingUser = await repository.create(
			User.createPending({
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				emailConfirmationTokenHash: 'token-hash',
				emailConfirmationTokenExpiresAt: new Date('2026-12-31T01:00:00.000Z'),
			}),
		);
		const emailConfirmationTokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('token-hash'),
		};
		const useCase = new ConfirmEmailUseCase(
			repository,
			emailConfirmationTokenService,
		);

		const confirmedUser = await useCase.execute({
			token: 'preview-token',
		});

		expect(confirmedUser).toMatchObject({
			id: pendingUser.id,
			isActive: true,
			emailConfirmationToken: null,
		});
		expect(confirmedUser.emailConfirmedAt).toBeInstanceOf(Date);

		const persistedUser = await repository.findById(pendingUser.id);
		expect(persistedUser).toMatchObject({
			id: pendingUser.id,
			isActive: true,
			emailConfirmationTokenHash: null,
			emailConfirmationTokenExpiresAt: null,
		});
		expect(persistedUser?.emailConfirmedAt).toBeInstanceOf(Date);
	});

	it('rejects confirmation when the token is invalid', async () => {
		const repository = new InMemoryUserRepository();
		const emailConfirmationTokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('missing-token-hash'),
		};
		const useCase = new ConfirmEmailUseCase(
			repository,
			emailConfirmationTokenService,
		);

		await expect(
			useCase.execute({
				token: 'missing-token',
			}),
		).rejects.toBeInstanceOf(UserEmailConfirmationTokenInvalidError);
	});
});
