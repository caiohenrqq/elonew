import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';

export class InMemoryUserRepository implements UserRepositoryPort {
	private readonly users = new Map<string, User>();
	private nextId = 1;

	findById(id: string): Promise<User | null> {
		return Promise.resolve(this.users.get(id) ?? null);
	}

	findByEmail(email: string): Promise<User | null> {
		return Promise.resolve(
			[...this.users.values()].find((user) => user.email === email) ?? null,
		);
	}

	findByUsername(username: string): Promise<User | null> {
		return Promise.resolve(
			[...this.users.values()].find((user) => user.username === username) ??
				null,
		);
	}

	findByEmailConfirmationTokenHash(tokenHash: string): Promise<User | null> {
		return Promise.resolve(
			[...this.users.values()].find(
				(user) => user.emailConfirmationTokenHash === tokenHash,
			) ?? null,
		);
	}

	create(user: User): Promise<User> {
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

		return Promise.resolve(createdUser);
	}

	save(user: User): Promise<void> {
		this.users.set(user.id, user);
		return Promise.resolve();
	}
}
