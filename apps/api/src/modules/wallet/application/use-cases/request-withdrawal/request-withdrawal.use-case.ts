import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { Inject, Injectable } from '@nestjs/common';

type RequestWithdrawalInput = {
	boosterId: string;
	amount: number;
	requestedAt: Date;
};

@Injectable()
export class RequestWithdrawalUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
	) {}

	async execute(input: RequestWithdrawalInput): Promise<void> {
		const wallet =
			(await this.walletRepository.findByBoosterId(input.boosterId)) ??
			Wallet.create({ boosterId: input.boosterId });

		wallet.withdraw({
			amount: input.amount,
			requestedAt: input.requestedAt,
		});

		await this.walletRepository.save(wallet);
	}
}
