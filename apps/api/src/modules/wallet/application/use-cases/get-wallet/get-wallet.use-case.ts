import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { WalletNotFoundError } from '@modules/wallet/domain/wallet.errors';
import { Inject, Injectable } from '@nestjs/common';

type GetWalletInput = {
	boosterId: string;
};

type GetWalletOutput = {
	boosterId: string;
	balanceLocked: number;
	balanceWithdrawable: number;
} | null;

@Injectable()
export class GetWalletUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
	) {}

	async execute(input: GetWalletInput): Promise<NonNullable<GetWalletOutput>> {
		const wallet = await this.walletRepository.findByBoosterId(input.boosterId);
		if (!wallet) throw new WalletNotFoundError();

		return {
			boosterId: wallet.boosterId,
			balanceLocked: wallet.balanceLocked,
			balanceWithdrawable: wallet.balanceWithdrawable,
		};
	}
}
