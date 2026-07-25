import type {
	WalletTransactionReason,
	WalletTransactionReleaseSource,
	WalletTransactionType,
} from '@modules/wallet/domain/wallet.entity';

export const WALLET_TRANSACTION_READER_KEY = Symbol(
	'WALLET_TRANSACTION_READER_KEY',
);

export type WalletTransactionSnapshot = {
	id: string;
	orderId: string | null;
	amount: number;
	type: WalletTransactionType;
	reason: WalletTransactionReason;
	availableAt: Date;
	releasedAt: Date | null;
	releasedBy: WalletTransactionReleaseSource | null;
	createdAt: Date;
};

export interface WalletTransactionReaderPort {
	findRecentForBooster(
		boosterId: string,
		limit: number,
	): Promise<WalletTransactionSnapshot[] | null>;
}
