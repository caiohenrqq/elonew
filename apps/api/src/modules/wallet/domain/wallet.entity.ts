import {
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
} from '@modules/wallet/domain/wallet.errors';

export type WalletTransactionType = 'credit' | 'debit';

export type WalletTransactionReason = 'order_completion' | 'withdrawal_request';

export type WalletTransaction = {
	orderId: string | null;
	amount: number;
	type: WalletTransactionType;
	reason: WalletTransactionReason;
	availableAt: Date;
	releasedAt: Date | null;
	createdAt: Date;
};

type CreditLockedInput = {
	orderId: string;
	amount: number;
	availableAt: Date;
};

type WithdrawInput = {
	amount: number;
	requestedAt: Date;
};

export class Wallet {
	private constructor(
		public readonly boosterId: string,
		public balanceLocked: number,
		public balanceWithdrawable: number,
		public readonly transactions: WalletTransaction[],
	) {}

	static create(input: { boosterId: string }): Wallet {
		return new Wallet(input.boosterId, 0, 0, []);
	}

	static rehydrate(input: {
		boosterId: string;
		balanceLocked: number;
		balanceWithdrawable: number;
		transactions: WalletTransaction[];
	}): Wallet {
		return new Wallet(
			input.boosterId,
			input.balanceLocked,
			input.balanceWithdrawable,
			[...input.transactions],
		);
	}

	creditLocked(input: CreditLockedInput): void {
		this.assertPositiveAmount(input.amount);

		this.balanceLocked = this.roundToCents(this.balanceLocked + input.amount);
		this.transactions.push({
			orderId: input.orderId,
			amount: input.amount,
			type: 'credit',
			reason: 'order_completion',
			availableAt: input.availableAt,
			releasedAt: null,
			createdAt: input.availableAt,
		});
	}

	releaseMaturedFunds(now: Date): void {
		for (const transaction of this.transactions) {
			if (transaction.type !== 'credit') continue;
			if (transaction.releasedAt) continue;
			if (transaction.availableAt > now) continue;

			transaction.releasedAt = now;
			this.balanceLocked = this.roundToCents(
				this.balanceLocked - transaction.amount,
			);
			this.balanceWithdrawable = this.roundToCents(
				this.balanceWithdrawable + transaction.amount,
			);
		}
	}

	withdraw(input: WithdrawInput): void {
		this.assertPositiveAmount(input.amount);

		if (input.amount > this.balanceWithdrawable)
			throw new WalletInsufficientWithdrawableBalanceError();

		this.balanceWithdrawable = this.roundToCents(
			this.balanceWithdrawable - input.amount,
		);
		this.transactions.unshift({
			orderId: null,
			amount: input.amount,
			type: 'debit',
			reason: 'withdrawal_request',
			availableAt: input.requestedAt,
			releasedAt: input.requestedAt,
			createdAt: input.requestedAt,
		});
	}

	private assertPositiveAmount(amount: number): void {
		if (!Number.isFinite(amount) || amount <= 0)
			throw new WalletInvalidAmountError();
	}

	private roundToCents(amount: number): number {
		return Number(amount.toFixed(2));
	}
}
