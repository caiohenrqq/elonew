import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import { Role } from '@packages/auth/roles/role';

export class E2eUserRepositoryStub implements UserRepositoryPort {
	findById(id: string): Promise<User> {
		const role = id.startsWith('admin-')
			? Role.ADMIN
			: id.includes('booster')
				? Role.BOOSTER
				: Role.CLIENT;
		return Promise.resolve(
			User.rehydrate({
				id,
				username: id,
				email: `${id}@example.com`,
				passwordHash: 'hash',
				role,
				isActive: true,
				isBlocked: false,
				emailConfirmedAt: new Date(),
				emailConfirmationTokenHash: null,
				emailConfirmationTokenExpiresAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);
	}

	findByEmail(): Promise<null> {
		return Promise.resolve(null);
	}
	findByUsername(): Promise<null> {
		return Promise.resolve(null);
	}
	findByEmailConfirmationTokenHash(): Promise<null> {
		return Promise.resolve(null);
	}
	findByPasswordResetTokenHash(): Promise<null> {
		return Promise.resolve(null);
	}
	create(user: User): Promise<User> {
		return Promise.resolve(user);
	}
	save(): Promise<void> {
		return Promise.resolve();
	}
}
