import type { User } from '@modules/users/domain/user.entity';

export const USER_REPOSITORY_KEY = Symbol('USER_REPOSITORY_KEY');

export interface UserRepositoryPort {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByUsername(username: string): Promise<User | null>;
	findByEmailConfirmationTokenHash(tokenHash: string): Promise<User | null>;
	create(user: User): Promise<User>;
	save(user: User): Promise<void>;
}
