import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { InternalApiKeyGuard } from '@modules/auth/presentation/guards/internal-api-key.guard';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { WALLET_FUNDS_RELEASE_INTERNAL_ROUTE } from '@packages/shared/wallet/wallet-funds-release.contract';
import { WalletNotFoundError } from '../domain/wallet.errors';
import {
	type BoosterIdParamSchemaInput,
	boosterIdParamSchema,
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
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.BOOSTER)
	async get(
		@Param('boosterId', new ZodValidationPipe(boosterIdParamSchema))
		boosterId: BoosterIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		boosterId: string;
		balanceLocked: number;
		balanceWithdrawable: number;
	}> {
		if (currentUser.id !== boosterId) throw new WalletNotFoundError();
		return await this.getWalletUseCase.execute({ boosterId });
	}

	@Post('credits/order-completed')
	@UseGuards(InternalApiKeyGuard)
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
	@UseGuards(InternalApiKeyGuard)
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
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.BOOSTER)
	@HttpCode(200)
	async requestWithdrawal(
		@Param('boosterId', new ZodValidationPipe(boosterIdParamSchema))
		boosterId: BoosterIdParamSchemaInput,
		@Body(new ZodValidationPipe(requestWithdrawalSchema))
		body: RequestWithdrawalSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{ success: true }> {
		if (currentUser.id !== boosterId) throw new WalletNotFoundError();
		await this.requestWithdrawalUseCase.execute({
			boosterId,
			amount: body.amount,
			requestedAt: new Date(body.requestedAt),
		});
		return { success: true };
	}
}
