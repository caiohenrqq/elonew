import type { EmailConfirmationTokenServicePort } from '@modules/users/application/ports/email-confirmation-token.port';
import type { PasswordHasherPort } from '@modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { SetPasswordUseCase } from '@modules/users/application/use-cases/set-password/set-password.use-case';
import { User } from '@modules/users/domain/user.entity';
import { UserPasswordResetTokenInvalidError } from '@modules/users/domain/user.errors';
import { Role } from '@packages/auth/roles/role';

class InMemoryUserRepository implements UserRepositoryPort {
	private readonly users = new Map<string, User>();
	private nextId = 1;

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

	async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
		return (
			[...this.users.values()].find(
				(user) => user.passwordResetTokenHash === tokenHash,
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
			passwordResetTokenHash: user.passwordResetTokenHash,
			passwordResetTokenExpiresAt: user.passwordResetTokenExpiresAt,
			createdAt: new Date('2026-06-26T10:00:00.000Z'),
			updatedAt: new Date('2026-06-26T10:00:00.000Z'),
		});
		this.users.set(createdUser.id, createdUser);
		return createdUser;
	}

	async save(user: User): Promise<void> {
		this.users.set(user.id, user);
	}
}

describe('SetPasswordUseCase', () => {
	it('sets the password and activates a pending admin-created user', async () => {
		const users = new InMemoryUserRepository();
		const pendingUser = await users.create(
			User.createPendingFromAdmin({
				username: 'booster',
				email: 'booster@example.com',
				role: Role.BOOSTER,
				passwordResetTokenHash: 'hashed-token',
				passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
			}),
		);
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn().mockResolvedValue('new-hash'),
			verify: jest.fn(),
		};
		const tokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('hashed-token'),
		};
		const useCase = new SetPasswordUseCase(users, passwordHasher, tokenService);

		await expect(
			useCase.execute({
				token: 'raw-token',
				password: 'new-password-123',
			}),
		).resolves.toEqual({ ok: true });

		const activatedUser = await users.findById(pendingUser.id);
		expect(activatedUser?.passwordHash).toBe('new-hash');
		expect(activatedUser?.isActive).toBe(true);
		expect(activatedUser?.emailConfirmedAt).toBeInstanceOf(Date);
		expect(activatedUser?.passwordResetTokenHash).toBeNull();
	});

	it('rejects an expired password setup token', async () => {
		const users = new InMemoryUserRepository();
		await users.create(
			User.createPendingFromAdmin({
				username: 'booster',
				email: 'booster@example.com',
				role: Role.BOOSTER,
				passwordResetTokenHash: 'hashed-token',
				passwordResetTokenExpiresAt: new Date(Date.now() - 60_000),
			}),
		);
		const passwordHasher: PasswordHasherPort = {
			hash: jest.fn(),
			verify: jest.fn(),
		};
		const tokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn(),
			hash: jest.fn().mockReturnValue('hashed-token'),
		};
		const useCase = new SetPasswordUseCase(users, passwordHasher, tokenService);

		await expect(
			useCase.execute({
				token: 'raw-token',
				password: 'new-password-123',
			}),
		).rejects.toThrow(UserPasswordResetTokenInvalidError);
		expect(passwordHasher.hash).not.toHaveBeenCalled();
	});
});
