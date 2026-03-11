import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';

export class InMemoryUserRepository implements UserRepositoryPort {
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
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.users.set(createdUser.id, createdUser);

		return createdUser;
	}

	async save(user: User): Promise<void> {
		this.users.set(user.id, user);
	}
}
