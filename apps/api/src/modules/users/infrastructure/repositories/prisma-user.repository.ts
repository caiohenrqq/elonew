import { PrismaService } from '@app/common/prisma/prisma.service';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import {
	UserEmailAlreadyInUseError,
	UsernameAlreadyInUseError,
} from '@modules/users/domain/user.errors';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { ensurePersistedEnum } from '@packages/shared/utils/enum.utils';

type UserRecord = {
	id: string;
	username: string;
	email: string;
	password: string;
	role: string;
	isActive: boolean;
	emailConfirmedAt: Date | null;
	emailConfirmationTokenHash: string | null;
	emailConfirmationTokenExpiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

type UserDelegate = {
	findUnique(args: {
		where:
			| { id: string }
			| { email: string }
			| { username: string }
			| { emailConfirmationTokenHash: string };
	}): Promise<UserRecord | null>;
	create(args: {
		data: {
			username: string;
			email: string;
			password: string;
			role: string;
			isActive: boolean;
			emailConfirmedAt: Date | null;
			emailConfirmationTokenHash: string | null;
			emailConfirmationTokenExpiresAt: Date | null;
		};
	}): Promise<UserRecord>;
	update(args: {
		where: { id: string };
		data: {
			username: string;
			email: string;
			password: string;
			role: string;
			isActive: boolean;
			emailConfirmedAt: Date | null;
			emailConfirmationTokenHash: string | null;
			emailConfirmationTokenExpiresAt: Date | null;
		};
	}): Promise<UserRecord>;
};

type UserPrismaClient = {
	user: UserDelegate;
};

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string): Promise<User | null> {
		const record = await this.getDelegate().findUnique({
			where: { id },
		});
		if (!record) return null;

		return this.mapUserFromRecord(record);
	}

	async findByEmail(email: string): Promise<User | null> {
		const record = await this.getDelegate().findUnique({
			where: { email },
		});
		if (!record) return null;

		return this.mapUserFromRecord(record);
	}

	async findByUsername(username: string): Promise<User | null> {
		const record = await this.getDelegate().findUnique({
			where: { username },
		});
		if (!record) return null;

		return this.mapUserFromRecord(record);
	}

	async findByEmailConfirmationTokenHash(
		tokenHash: string,
	): Promise<User | null> {
		const record = await this.getDelegate().findUnique({
			where: { emailConfirmationTokenHash: tokenHash },
		});
		if (!record) return null;

		return this.mapUserFromRecord(record);
	}

	async create(user: User): Promise<User> {
		try {
			const record = await this.getDelegate().create({
				data: this.mapUserToPersistence(user),
			});

			return this.mapUserFromRecord(record);
		} catch (error) {
			if (this.isUniqueConstraintErrorFor(error, 'email'))
				throw new UserEmailAlreadyInUseError();
			if (this.isUniqueConstraintErrorFor(error, 'username'))
				throw new UsernameAlreadyInUseError();

			throw error;
		}
	}

	async save(user: User): Promise<void> {
		await this.getDelegate().update({
			where: { id: user.id },
			data: this.mapUserToPersistence(user),
		});
	}

	private getDelegate(): UserDelegate {
		return (this.prisma as unknown as UserPrismaClient).user;
	}

	private mapUserFromRecord(record: UserRecord): User {
		return User.rehydrate({
			id: record.id,
			username: record.username,
			email: record.email,
			passwordHash: record.password,
			role: ensurePersistedEnum(Role, record.role, 'user role'),
			isActive: record.isActive,
			emailConfirmedAt: record.emailConfirmedAt,
			emailConfirmationTokenHash: record.emailConfirmationTokenHash,
			emailConfirmationTokenExpiresAt: record.emailConfirmationTokenExpiresAt,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
		});
	}

	private mapUserToPersistence(user: User) {
		return {
			username: user.username,
			email: user.email,
			password: user.passwordHash,
			role: user.role,
			isActive: user.isActive,
			emailConfirmedAt: user.emailConfirmedAt,
			emailConfirmationTokenHash: user.emailConfirmationTokenHash,
			emailConfirmationTokenExpiresAt: user.emailConfirmationTokenExpiresAt,
		};
	}

	private isUniqueConstraintErrorFor(error: unknown, field: string): boolean {
		if (!this.isPrismaUniqueConstraintError(error)) return false;
		if (!error.meta || typeof error.meta !== 'object') return false;
		if (!('target' in error.meta)) return false;

		const { target } = error.meta as { target?: unknown };
		if (Array.isArray(target)) return target.includes(field);
		if (typeof target === 'string') return target === field;

		return false;
	}

	private isPrismaUniqueConstraintError(
		error: unknown,
	): error is { code: string; meta?: unknown } {
		return (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === 'P2002'
		);
	}
}
