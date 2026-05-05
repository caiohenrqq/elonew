import {
	WALLET_TRANSACTION_READER_KEY,
	type WalletTransactionReaderPort,
	type WalletTransactionSnapshot,
} from '@modules/wallet/application/ports/wallet-transaction-reader.port';
import { WalletNotFoundError } from '@modules/wallet/domain/wallet.errors';
import { Inject, Injectable } from '@nestjs/common';

type ListWalletTransactionsInput = {
	boosterId: string;
	limit?: number;
};

type ListWalletTransactionsOutput = {
	transactions: WalletTransactionSnapshot[];
};

const WALLET_TRANSACTION_LIMIT_DEFAULT = 10;
const WALLET_TRANSACTION_LIMIT_MAX = 50;

@Injectable()
export class ListWalletTransactionsUseCase {
	constructor(
		@Inject(WALLET_TRANSACTION_READER_KEY)
		private readonly walletTransactionReader: WalletTransactionReaderPort,
	) {}

	async execute(
		input: ListWalletTransactionsInput,
	): Promise<ListWalletTransactionsOutput> {
		const limit = Math.min(
			input.limit ?? WALLET_TRANSACTION_LIMIT_DEFAULT,
			WALLET_TRANSACTION_LIMIT_MAX,
		);
		const transactions =
			await this.walletTransactionReader.findRecentForBooster(
				input.boosterId,
				limit,
			);
		if (!transactions) throw new WalletNotFoundError();

		return {
			transactions,
		};
	}
}
