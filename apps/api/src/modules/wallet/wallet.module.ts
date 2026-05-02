import { PrismaModule } from '@app/common/prisma/prisma.module';
import { ORDER_COMPLETION_EARNINGS_PORT_KEY } from '@modules/orders/application/ports/order-completion-earnings.port';
import { WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY } from '@modules/wallet/application/ports/wallet-funds-release-job-scheduler.port';
import { WALLET_REPOSITORY_KEY } from '@modules/wallet/application/ports/wallet-repository.port';
import { WALLET_TRANSACTION_READER_KEY } from '@modules/wallet/application/ports/wallet-transaction-reader.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { ListWalletTransactionsUseCase } from '@modules/wallet/application/use-cases/list-wallet-transactions/list-wallet-transactions.use-case';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import { OrderCompletionEarningsFromWalletAdapter } from '@modules/wallet/infrastructure/adapters/order-completion-earnings-from-wallet.adapter';
import { BullmqWalletFundsReleaseJobSchedulerAdapter } from '@modules/wallet/infrastructure/queue/bullmq-wallet-funds-release-job-scheduler.adapter';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/repositories/prisma-wallet.repository';
import { WalletsController } from '@modules/wallet/presentation/wallets.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule],
	controllers: [WalletsController],
	providers: [
		PrismaWalletRepository,
		{
			provide: WALLET_REPOSITORY_KEY,
			useFactory: (
				walletRepository: PrismaWalletRepository,
			): PrismaWalletRepository => walletRepository,
			inject: [PrismaWalletRepository],
		},
		{
			provide: WALLET_TRANSACTION_READER_KEY,
			useFactory: (
				walletRepository: PrismaWalletRepository,
			): PrismaWalletRepository => walletRepository,
			inject: [PrismaWalletRepository],
		},
		BullmqWalletFundsReleaseJobSchedulerAdapter,
		{
			provide: WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY,
			useFactory: (
				walletFundsReleaseJobScheduler: BullmqWalletFundsReleaseJobSchedulerAdapter,
			): BullmqWalletFundsReleaseJobSchedulerAdapter =>
				walletFundsReleaseJobScheduler,
			inject: [BullmqWalletFundsReleaseJobSchedulerAdapter],
		},
		OrderCompletionEarningsFromWalletAdapter,
		{
			provide: ORDER_COMPLETION_EARNINGS_PORT_KEY,
			useFactory: (
				orderCompletionEarningsPort: OrderCompletionEarningsFromWalletAdapter,
			): OrderCompletionEarningsFromWalletAdapter =>
				orderCompletionEarningsPort,
			inject: [OrderCompletionEarningsFromWalletAdapter],
		},
		GetWalletUseCase,
		ListWalletTransactionsUseCase,
		CreditCompletedOrderEarningsUseCase,
		ReleaseMaturedWalletFundsUseCase,
		RequestWithdrawalUseCase,
	],
	exports: [
		ORDER_COMPLETION_EARNINGS_PORT_KEY,
		GetWalletUseCase,
		ListWalletTransactionsUseCase,
		CreditCompletedOrderEarningsUseCase,
		ReleaseMaturedWalletFundsUseCase,
		RequestWithdrawalUseCase,
	],
})
export class WalletModule {}
