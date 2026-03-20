import { PrismaService } from '@app/common/prisma/prisma.service';
import { UserEmailConfirmationTokenInvalidError } from '@modules/users/domain/user.errors';
import { UsersController } from '@modules/users/presentation/users.controller';
import { UsersModule } from '@modules/users/users.module';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

describe('Users module integration (db)', () => {
	let moduleRef: TestingModule;
	let controller: UsersController;
	let prisma: PrismaService;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [UsersModule],
		}).compile();

		controller = moduleRef.get(UsersController);
		prisma = moduleRef.get(PrismaService);
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.walletTransaction.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.orderCredentials.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.order.deleteMany();
		await prisma.authSession.deleteMany();
		await prisma.wallet.deleteMany();
		await prisma.user.deleteMany();
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates a pending user and persists confirmation fields', async () => {
		const createdUser = await controller.signUp({
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'Secret123456!',
		});

		expect(createdUser).toMatchObject({
			id: expect.any(String),
			username: 'summoner1',
			email: 'summoner1@example.com',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationPreviewToken: expect.any(String),
		});

		const persistedUser = await prisma.user.findUnique({
			where: { id: createdUser.id },
		});
		expect(persistedUser).toMatchObject({
			id: createdUser.id,
			username: 'summoner1',
			email: 'summoner1@example.com',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationTokenHash: expect.any(String),
			emailConfirmationTokenExpiresAt: expect.any(Date),
		});
		expect(persistedUser?.password).not.toBe('Secret123456!');
	});

	it('confirms a user and activates the persisted account', async () => {
		const createdUser = await controller.signUp({
			username: 'summoner2',
			email: 'summoner2@example.com',
			password: 'Secret123456!',
		});

		await expect(
			controller.confirmEmail({
				token: createdUser.emailConfirmationPreviewToken as string,
			}),
		).resolves.toMatchObject({
			id: createdUser.id,
			isActive: true,
			emailConfirmationToken: null,
		});

		const persistedUser = await prisma.user.findUnique({
			where: { id: createdUser.id },
		});
		expect(persistedUser).toMatchObject({
			id: createdUser.id,
			isActive: true,
			emailConfirmationTokenHash: null,
			emailConfirmationTokenExpiresAt: null,
		});
		expect(persistedUser?.emailConfirmedAt).toBeInstanceOf(Date);
	});

	it('propagates invalid confirmation token as a typed domain error', async () => {
		await expect(
			controller.confirmEmail({
				token: 'missing-token',
			}),
		).rejects.toBeInstanceOf(UserEmailConfirmationTokenInvalidError);
	});
});
