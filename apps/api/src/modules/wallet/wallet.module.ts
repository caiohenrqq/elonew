import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { ORDER_COMPLETION_EARNINGS_PORT_KEY } from '@modules/orders/application/ports/order-completion-earnings.port';
import { WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import { OrderCompletionEarningsFromWalletAdapter } from '@modules/wallet/infrastructure/adapters/order-completion-earnings-from-wallet.adapter';
import { BullmqWalletFundsReleaseJobSchedulerAdapter } from '@modules/wallet/infrastructure/queue/bullmq-wallet-funds-release-job-scheduler.adapter';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/repositories/prisma-wallet.repository';
import { WalletsController } from '@modules/wallet/presentation/wallets.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule],
	controllers: [WalletsController],
	providers: [
		PrismaService,
		PrismaWalletRepository,
		BullmqWalletFundsReleaseJobSchedulerAdapter,
		{
			provide: WALLET_REPOSITORY_KEY,
			useExisting: PrismaWalletRepository,
		},
		{
			provide: WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY,
			useExisting: BullmqWalletFundsReleaseJobSchedulerAdapter,
		},
		OrderCompletionEarningsFromWalletAdapter,
		{
			provide: ORDER_COMPLETION_EARNINGS_PORT_KEY,
			useExisting: OrderCompletionEarningsFromWalletAdapter,
		},
		GetWalletUseCase,
		CreditCompletedOrderEarningsUseCase,
		ReleaseMaturedWalletFundsUseCase,
		RequestWithdrawalUseCase,
	],
	exports: [
		ORDER_COMPLETION_EARNINGS_PORT_KEY,
		GetWalletUseCase,
		CreditCompletedOrderEarningsUseCase,
		ReleaseMaturedWalletFundsUseCase,
		RequestWithdrawalUseCase,
	],
})
export class WalletModule {}
