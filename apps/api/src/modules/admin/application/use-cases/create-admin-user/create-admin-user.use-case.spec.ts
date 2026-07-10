import type { EmailSenderPort } from '@app/common/email/ports/email-sender.port';
import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { AdminUserLifecycleLogger } from '@modules/admin/application/logging/admin-user-lifecycle.logger';
import type {
	AdminGovernanceActionInput,
	AdminGovernanceRepositoryPort,
} from '@modules/admin/application/ports/admin-governance.repository';
import { CreateAdminUserUseCase } from '@modules/admin/application/use-cases/create-admin-user/create-admin-user.use-case';
import type { Order } from '@modules/orders/domain/order.entity';
import type { EmailConfirmationTokenServicePort } from '@modules/users/application/ports/email-confirmation-token.port';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import type { User } from '@modules/users/domain/user.entity';
import { User as UserEntity } from '@modules/users/domain/user.entity';
import { Role } from '@packages/auth/roles/role';

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
		const createdUser = UserEntity.rehydrate({
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

class AdminGovernanceRepositoryStub implements AdminGovernanceRepositoryPort {
	actions: AdminGovernanceActionInput[] = [];

	constructor(private readonly users: InMemoryUserRepository) {}

	findUserById(userId: string): Promise<User | null> {
		return this.users.findById(userId);
	}

	saveUser(user: User): Promise<void> {
		return this.users.save(user);
	}

	findOrderById(): Promise<Order | null> {
		return Promise.resolve(null);
	}

	saveOrder(): Promise<void> {
		return Promise.resolve();
	}

	recordAction(action: AdminGovernanceActionInput): Promise<void> {
		this.actions.push(action);
		return Promise.resolve();
	}
	updateUserAndRecordAction(): Promise<void> {
		return Promise.resolve();
	}
}

const appSettings = {
	webAppUrl: 'https://app.elonew.com',
	emailConfirmationTokenTtlMinutes: 30,
} as unknown as AppSettingsService;

const lifecycleLogger = {
	emit: jest.fn(),
} as unknown as AdminUserLifecycleLogger;

describe('CreateAdminUserUseCase', () => {
	it('creates a pending user, records audit, and sends setup email', async () => {
		const users = new InMemoryUserRepository();
		const governance = new AdminGovernanceRepositoryStub(users);
		const emailSender: EmailSenderPort = {
			send: jest.fn().mockResolvedValue(undefined),
		};
		const tokenService: EmailConfirmationTokenServicePort = {
			generate: jest.fn().mockReturnValue({
				rawToken: 'raw-token',
				tokenHash: 'hashed-token',
				expiresAt: new Date('2026-06-26T10:30:00.000Z'),
			}),
			hash: jest.fn(),
		};
		const useCase = new CreateAdminUserUseCase(
			users,
			governance,
			tokenService,
			emailSender,
			appSettings,
			lifecycleLogger,
		);
		const now = new Date('2026-06-26T10:00:00.000Z');

		const result = await useCase.execute({
			adminUserId: 'admin-1',
			username: 'booster',
			email: 'Booster@Example.com',
			role: Role.BOOSTER,
			now,
		});

		const createdUser = await users.findById(result.id);
		expect(createdUser?.email).toBe('booster@example.com');
		expect(createdUser?.role).toBe(Role.BOOSTER);
		expect(createdUser?.isActive).toBe(false);
		expect(createdUser?.emailConfirmedAt).toBeNull();
		expect(createdUser?.passwordHash).toBeNull();
		expect(createdUser?.passwordResetTokenHash).toBe('hashed-token');
		expect(governance.actions).toEqual([
			{
				adminUserId: 'admin-1',
				actionType: 'USER_CREATE',
				reason: 'admin_user_create',
				targetUserId: result.id,
				createdAt: now,
			},
		]);
		expect(emailSender.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'booster@example.com',
				subject: 'Defina sua senha na EloNew',
			}),
		);
		expect(result.passwordSetupEmailSent).toBe(true);
	});
});
