import { PrismaService } from '@app/common/prisma/prisma.service';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

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
		const record = await this.getDelegate().create({
			data: this.mapUserToPersistence(user),
		});

		return this.mapUserFromRecord(record);
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
}
