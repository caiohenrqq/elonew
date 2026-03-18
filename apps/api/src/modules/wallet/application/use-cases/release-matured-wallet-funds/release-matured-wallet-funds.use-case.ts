import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Inject, Injectable } from '@nestjs/common';

type ReleaseMaturedWalletFundsInput = {
	boosterId: string;
	orderId: string;
	now: Date;
};

@Injectable()
export class ReleaseMaturedWalletFundsUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
	) {}

	async execute(input: ReleaseMaturedWalletFundsInput): Promise<void> {
		const wallet = await this.walletRepository.findByBoosterId(input.boosterId);
		if (!wallet) return;

		wallet.releaseOrderCompletionFunds({
			orderId: input.orderId,
			now: input.now,
		});
		await this.walletRepository.save(wallet);
	}
}
