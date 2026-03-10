import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { GetWalletUseCase } from '@modules/wallet/application/use-cases/get-wallet/get-wallet.use-case';
import { ReleaseMaturedWalletFundsUseCase } from '@modules/wallet/application/use-cases/release-matured-wallet-funds/release-matured-wallet-funds.use-case';
import { RequestWithdrawalUseCase } from '@modules/wallet/application/use-cases/request-withdrawal/request-withdrawal.use-case';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import { WalletsController } from '@modules/wallet/presentation/wallets.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';

type MutationUseCase = {
	execute: jest.Mock<Promise<void>, [unknown]>;
};

type GetWalletUseCaseMock = {
	execute: jest.Mock<
		Promise<{
			boosterId: string;
			balanceLocked: number;
			balanceWithdrawable: number;
		}>,
		[unknown]
	>;
};

function makeMutationUseCase(): MutationUseCase {
	return {
		execute: jest.fn().mockResolvedValue(undefined),
	};
}

function makeController() {
	const getWalletUseCase: GetWalletUseCaseMock = {
		execute: jest.fn(),
	};
	const creditCompletedOrderEarningsUseCase = makeMutationUseCase();
	const releaseMaturedWalletFundsUseCase = makeMutationUseCase();
	const requestWithdrawalUseCase = makeMutationUseCase();

	return {
		controller: new WalletsController(
			getWalletUseCase as unknown as GetWalletUseCase,
			creditCompletedOrderEarningsUseCase as unknown as CreditCompletedOrderEarningsUseCase,
			releaseMaturedWalletFundsUseCase as unknown as ReleaseMaturedWalletFundsUseCase,
			requestWithdrawalUseCase as unknown as RequestWithdrawalUseCase,
		),
		getWalletUseCase,
		requestWithdrawalUseCase,
	};
}

describe('WalletsController', () => {
	it('returns wallet details from the use-case', async () => {
		const { controller, getWalletUseCase } = makeController();
		getWalletUseCase.execute.mockResolvedValue({
			boosterId: 'booster-1',
			balanceLocked: 50,
			balanceWithdrawable: 20,
		});

		await expect(controller.get('booster-1')).resolves.toEqual({
			boosterId: 'booster-1',
			balanceLocked: 50,
			balanceWithdrawable: 20,
		});
	});

	it('maps get not-found errors to NotFoundException', async () => {
		const { controller, getWalletUseCase } = makeController();
		getWalletUseCase.execute.mockRejectedValue(new WalletNotFoundError());

		await expect(controller.get('booster-2')).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it('maps request-withdrawal domain errors to BadRequestException', async () => {
		const { controller, requestWithdrawalUseCase } = makeController();
		requestWithdrawalUseCase.execute.mockRejectedValue(
			new WalletInsufficientWithdrawableBalanceError(),
		);

		await expect(
			controller.requestWithdrawal('booster-3', {
				amount: 10,
				requestedAt: '2026-03-10T00:00:00.000Z',
			}),
		).rejects.toBeInstanceOf(BadRequestException);
	});
});
