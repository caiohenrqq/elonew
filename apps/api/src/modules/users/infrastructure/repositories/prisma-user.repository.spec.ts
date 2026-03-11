import {
	UserEmailAlreadyInUseError,
	UsernameAlreadyInUseError,
} from '@modules/users/domain/user.errors';
import { PrismaUserRepository } from '@modules/users/infrastructure/repositories/prisma-user.repository';

describe('PrismaUserRepository', () => {
	it('creates a pending user with confirmation fields', async () => {
		const create = jest.fn().mockResolvedValue({
			id: 'user-1',
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'hashed-password',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationTokenHash: 'token-hash',
			emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
			createdAt: new Date('2026-03-11T00:00:00.000Z'),
			updatedAt: new Date('2026-03-11T00:00:00.000Z'),
		});
		const prisma = {
			user: {
				create,
				findUnique: jest.fn(),
				update: jest.fn(),
			},
		};
		const repository = new PrismaUserRepository(prisma as never);

		const createdUser = await repository.create({
			id: '',
			username: 'summoner1',
			email: 'summoner1@example.com',
			passwordHash: 'hashed-password',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationTokenHash: 'token-hash',
			emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
			createdAt: new Date('2026-03-11T00:00:00.000Z'),
			updatedAt: new Date('2026-03-11T00:00:00.000Z'),
		} as never);

		expect(createdUser).toMatchObject({
			id: 'user-1',
			username: 'summoner1',
			email: 'summoner1@example.com',
			passwordHash: 'hashed-password',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationTokenHash: 'token-hash',
			emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
		});
		expect(create).toHaveBeenCalledWith({
			data: {
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'hashed-password',
				role: 'CLIENT',
				isActive: false,
				emailConfirmedAt: null,
				emailConfirmationTokenHash: 'token-hash',
				emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
			},
		});
	});

	it('finds a user by confirmation token', async () => {
		const findUnique = jest.fn().mockResolvedValue({
			id: 'user-1',
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'hashed-password',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationTokenHash: 'token-hash',
			emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
			createdAt: new Date('2026-03-11T00:00:00.000Z'),
			updatedAt: new Date('2026-03-11T00:00:00.000Z'),
		});
		const prisma = {
			user: {
				create: jest.fn(),
				findUnique,
				update: jest.fn(),
			},
		};
		const repository = new PrismaUserRepository(prisma as never);

		await expect(
			repository.findByEmailConfirmationTokenHash('token-hash'),
		).resolves.toMatchObject({
			id: 'user-1',
			username: 'summoner1',
			email: 'summoner1@example.com',
			passwordHash: 'hashed-password',
			emailConfirmationTokenHash: 'token-hash',
		});
		expect(findUnique).toHaveBeenCalledWith({
			where: {
				emailConfirmationTokenHash: 'token-hash',
			},
		});
	});

	it('maps email unique-constraint races to a typed domain error', async () => {
		const create = jest.fn().mockRejectedValue({
			code: 'P2002',
			meta: {
				target: ['email'],
			},
		});
		const prisma = {
			user: {
				create,
				findUnique: jest.fn(),
				update: jest.fn(),
			},
		};
		const repository = new PrismaUserRepository(prisma as never);

		await expect(
			repository.create({
				id: '',
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				role: 'CLIENT',
				isActive: false,
				emailConfirmedAt: null,
				emailConfirmationTokenHash: 'token-hash',
				emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
				createdAt: new Date('2026-03-11T00:00:00.000Z'),
				updatedAt: new Date('2026-03-11T00:00:00.000Z'),
			} as never),
		).rejects.toBeInstanceOf(UserEmailAlreadyInUseError);
	});

	it('maps username unique-constraint races to a typed domain error', async () => {
		const create = jest.fn().mockRejectedValue({
			code: 'P2002',
			meta: {
				target: ['username'],
			},
		});
		const prisma = {
			user: {
				create,
				findUnique: jest.fn(),
				update: jest.fn(),
			},
		};
		const repository = new PrismaUserRepository(prisma as never);

		await expect(
			repository.create({
				id: '',
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				role: 'CLIENT',
				isActive: false,
				emailConfirmedAt: null,
				emailConfirmationTokenHash: 'token-hash',
				emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
				createdAt: new Date('2026-03-11T00:00:00.000Z'),
				updatedAt: new Date('2026-03-11T00:00:00.000Z'),
			} as never),
		).rejects.toBeInstanceOf(UsernameAlreadyInUseError);
	});

	it('rethrows unexpected persistence errors', async () => {
		const error = new Error('unexpected persistence failure');
		const create = jest.fn().mockRejectedValue(error);
		const prisma = {
			user: {
				create,
				findUnique: jest.fn(),
				update: jest.fn(),
			},
		};
		const repository = new PrismaUserRepository(prisma as never);

		await expect(
			repository.create({
				id: '',
				username: 'summoner1',
				email: 'summoner1@example.com',
				passwordHash: 'hashed-password',
				role: 'CLIENT',
				isActive: false,
				emailConfirmedAt: null,
				emailConfirmationTokenHash: 'token-hash',
				emailConfirmationTokenExpiresAt: new Date('2026-03-11T01:00:00.000Z'),
				createdAt: new Date('2026-03-11T00:00:00.000Z'),
				updatedAt: new Date('2026-03-11T00:00:00.000Z'),
			} as never),
		).rejects.toBe(error);
	});
});
