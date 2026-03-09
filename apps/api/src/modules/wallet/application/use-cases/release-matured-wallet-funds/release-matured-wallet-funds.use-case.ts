import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Inject, Injectable } from '@nestjs/common';

type ReleaseMaturedWalletFundsInput = {
	now: Date;
};

@Injectable()
export class ReleaseMaturedWalletFundsUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
	) {}

	async execute(input: ReleaseMaturedWalletFundsInput): Promise<void> {
		const wallets = await this.walletRepository.findAll();

		for (const wallet of wallets) {
			wallet.releaseMaturedFunds(input.now);
			await this.walletRepository.save(wallet);
		}
	}
}
