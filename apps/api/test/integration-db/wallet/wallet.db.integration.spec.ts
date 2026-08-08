import { PrismaModule } from '@app/common/prisma/prisma.module';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { PrismaAdminDashboardReader } from '@modules/admin/infrastructure/repositories/prisma-admin-dashboard.reader';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/repositories/prisma-wallet.repository';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

describe('Wallet withdrawal persistence (db)', () => {
	let moduleRef: TestingModule;
	let prisma: PrismaService;
	let boosterId: string | undefined;

	beforeEach(async () => {
		boosterId = undefined;
		moduleRef = await Test.createTestingModule({
			imports: [PrismaModule],
		}).compile();
		prisma = moduleRef.get(PrismaService);
	});

	afterEach(async () => {
		if (boosterId) {
			await prisma.walletTransaction.deleteMany({
				where: { wallet: { boosterId } },
			});
			await prisma.wallet.deleteMany({ where: { boosterId } });
			await prisma.user.deleteMany({ where: { id: boosterId } });
		}
		await moduleRef.close();
	});

	it('persists the PIX key and lists both new and legacy requests for admins', async () => {
		const booster = await prisma.user.create({
			data: {
				username: 'withdrawal-booster',
				email: 'withdrawal-booster@example.com',
				role: 'BOOSTER',
			},
		});
		boosterId = booster.id;
		const wallet = Wallet.rehydrate({
			boosterId: booster.id,
			balanceLocked: 0,
			balanceWithdrawable: 5000,
			transactions: [],
		});
		wallet.withdraw({
			amount: 2500,
			payoutPixKey: 'booster@example.com',
			requestedAt: new Date('2026-08-08T12:00:00.000Z'),
		});

		const walletRepository = new PrismaWalletRepository(prisma);
		await walletRepository.save(wallet);
		const persistedWallet = await prisma.wallet.findUniqueOrThrow({
			where: { boosterId: booster.id },
		});
		await prisma.walletTransaction.create({
			data: {
				walletId: persistedWallet.id,
				amount: 1000,
				type: 'DEBIT',
				reason: 'withdrawal_request',
				availableAt: new Date('2026-08-07T12:00:00.000Z'),
				releasedAt: new Date('2026-08-07T12:00:00.000Z'),
				createdAt: new Date('2026-08-07T12:00:00.000Z'),
			},
		});
		const boosterTransactions = await walletRepository.findRecentForBooster(
			booster.id,
			10,
		);
		expect(boosterTransactions?.[0]).not.toHaveProperty('payoutPixKey');

		const adminReader = new PrismaAdminDashboardReader(prisma);
		const initialRequests = await adminReader.listWithdrawalRequests({
			limit: 10,
		});
		const boosterRequests = initialRequests.filter(
			(request) => request.boosterId === booster.id,
		);
		expect(boosterRequests).toEqual([
			expect.objectContaining({
				amount: 2500,
				payoutPixKey: 'booster@example.com',
			}),
			expect.objectContaining({ amount: 1000, payoutPixKey: null }),
		]);

		const originalRequestId = boosterRequests.find(
			(request) => request.amount === 2500,
		)?.id;
		const rehydratedWallet = await walletRepository.findByBoosterId(booster.id);
		expect(rehydratedWallet).not.toBeNull();
		rehydratedWallet?.withdraw({
			amount: 500,
			payoutPixKey: 'second@example.com',
			requestedAt: new Date('2026-08-09T12:00:00.000Z'),
		});
		if (rehydratedWallet) await walletRepository.save(rehydratedWallet);

		const requestsAfterWalletSave = await adminReader.listWithdrawalRequests({
			limit: 10,
		});
		expect(
			requestsAfterWalletSave.find(
				(request) =>
					request.boosterId === booster.id && request.amount === 2500,
			)?.id,
		).toBe(originalRequestId);
	});
});
