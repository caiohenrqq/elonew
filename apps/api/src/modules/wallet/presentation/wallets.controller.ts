import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { WALLET_FUNDS_RELEASE_INTERNAL_ROUTE } from '@shared/wallet/wallet-funds-release.contract';
import {
	type CreditCompletedOrderEarningsSchemaInput,
	creditCompletedOrderEarningsSchema,
	type ReleaseMaturedWalletFundsSchemaInput,
	type RequestWithdrawalSchemaInput,
	releaseMaturedWalletFundsSchema,
	requestWithdrawalSchema,
} from './wallets.request-schemas';

@Controller('wallets')
export class WalletsController {
	constructor(
		private readonly getWalletUseCase: GetWalletUseCase,
		private readonly creditCompletedOrderEarningsUseCase: CreditCompletedOrderEarningsUseCase,
		private readonly releaseMaturedWalletFundsUseCase: ReleaseMaturedWalletFundsUseCase,
		private readonly requestWithdrawalUseCase: RequestWithdrawalUseCase,
	) {}

	@Get(':boosterId')
	async get(@Param('boosterId') boosterId: string): Promise<{
		boosterId: string;
		balanceLocked: number;
		balanceWithdrawable: number;
	}> {
		return await this.getWalletUseCase.execute({ boosterId });
	}

	@Post('credits/order-completed')
	@HttpCode(200)
	async creditCompletedOrderEarnings(
		@Body(new ZodValidationPipe(creditCompletedOrderEarningsSchema))
		body: CreditCompletedOrderEarningsSchemaInput,
	): Promise<{ success: true }> {
		await this.creditCompletedOrderEarningsUseCase.execute({
			orderId: body.orderId,
			boosterId: body.boosterId,
			amount: body.amount,
			completedAt: new Date(body.completedAt),
			lockPeriodInHours: body.lockPeriodInHours,
		});
		return { success: true };
	}

	@Post(WALLET_FUNDS_RELEASE_INTERNAL_ROUTE.replace('/wallets/', ''))
	@HttpCode(200)
	async releaseMaturedFunds(
		@Body(new ZodValidationPipe(releaseMaturedWalletFundsSchema))
		body: ReleaseMaturedWalletFundsSchemaInput,
	): Promise<{ success: true }> {
		await this.releaseMaturedWalletFundsUseCase.execute({
			orderId: body.orderId,
			boosterId: body.boosterId,
			now: new Date(body.now),
		});
		return { success: true };
	}

	@Post(':boosterId/withdrawals')
	@HttpCode(200)
	async requestWithdrawal(
		@Param('boosterId') boosterId: string,
		@Body(new ZodValidationPipe(requestWithdrawalSchema))
		body: RequestWithdrawalSchemaInput,
	): Promise<{ success: true }> {
		await this.requestWithdrawalUseCase.execute({
			boosterId,
			amount: body.amount,
			requestedAt: new Date(body.requestedAt),
		});
		return { success: true };
	}
}
