import {
	mapAsBadRequest,
	mapAsNotFound,
	mapDomainErrorToHttpException,
} from '@app/common/http/domain-error.mapper';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
	WalletNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Post,
} from '@nestjs/common';

type ReleaseMaturedWalletFundsRequestBody = {
	now: string;
};

type RequestWithdrawalRequestBody = {
	amount: number;
	requestedAt: string;
};

type CreditCompletedOrderEarningsRequestBody = {
	orderId: string;
	boosterId: string;
	amount: number;
	completedAt: string;
	lockPeriodInHours: number;
};

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
		try {
			return await this.getWalletUseCase.execute({ boosterId });
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	@Post('credits/order-completed')
	@HttpCode(200)
	async creditCompletedOrderEarnings(
		@Body() body: CreditCompletedOrderEarningsRequestBody,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.creditCompletedOrderEarningsUseCase.execute({
				orderId: body.orderId,
				boosterId: body.boosterId,
				amount: body.amount,
				completedAt: new Date(body.completedAt),
				lockPeriodInHours: body.lockPeriodInHours,
			}),
		);
	}

	@Post('internal/release-matured-funds')
	@HttpCode(200)
	async releaseMaturedFunds(
		@Body() body: ReleaseMaturedWalletFundsRequestBody,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.releaseMaturedWalletFundsUseCase.execute({
				now: new Date(body.now),
			}),
		);
	}

	@Post(':boosterId/withdrawals')
	@HttpCode(200)
	async requestWithdrawal(
		@Param('boosterId') boosterId: string,
		@Body() body: RequestWithdrawalRequestBody,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.requestWithdrawalUseCase.execute({
				boosterId,
				amount: body.amount,
				requestedAt: new Date(body.requestedAt),
			}),
		);
	}

	private async executeMutation(
		mutation: () => Promise<void>,
	): Promise<{ success: true }> {
		try {
			await mutation();
			return { success: true };
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	private mapDomainError(
		error: unknown,
	): BadRequestException | NotFoundException {
		return mapDomainErrorToHttpException(error, [
			mapAsNotFound(WalletNotFoundError),
			mapAsBadRequest(
				WalletInvalidAmountError,
				WalletInsufficientWithdrawableBalanceError,
			),
		]) as BadRequestException | NotFoundException;
	}
}
