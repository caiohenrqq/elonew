import {
	WALLET_REPOSITORY_KEY,
	type WalletRepositoryPort,
} from '@modules/wallet/application/ports/wallet-repository.port';
import { Wallet } from '@modules/wallet/domain/wallet.entity';
import { Inject, Injectable } from '@nestjs/common';

type CreditCompletedOrderEarningsInput = {
	orderId: string;
	boosterId: string;
	amount: number;
	completedAt: Date;
	lockPeriodInHours: number;
};

@Injectable()
export class CreditCompletedOrderEarningsUseCase {
	constructor(
		@Inject(WALLET_REPOSITORY_KEY)
		private readonly walletRepository: WalletRepositoryPort,
	) {}

	async execute(input: CreditCompletedOrderEarningsInput): Promise<void> {
		const wallet =
			(await this.walletRepository.findByBoosterId(input.boosterId)) ??
			Wallet.create({ boosterId: input.boosterId });

		wallet.creditLocked({
			orderId: input.orderId,
			amount: input.amount,
			availableAt: new Date(
				input.completedAt.getTime() + input.lockPeriodInHours * 60 * 60 * 1000,
			),
		});

		await this.walletRepository.save(wallet);
	}
}
