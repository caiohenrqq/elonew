import {
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
} from '@modules/wallet/domain/wallet.errors';
import { Money } from '@packages/shared/money/money';

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

		this.balanceLocked = Money.fromCents(this.balanceLocked).add(
			Money.fromCents(input.amount),
		).cents;
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

	findOrderCompletionCredit(orderId: string): WalletTransaction | null {
		return (
			this.transactions.find(
				(transaction) =>
					transaction.type === 'credit' &&
					transaction.reason === 'order_completion' &&
					transaction.orderId === orderId,
			) ?? null
		);
	}

	releaseMaturedFunds(now: Date): void {
		for (const transaction of this.transactions) {
			if (transaction.type !== 'credit') continue;
			if (transaction.releasedAt) continue;
			if (transaction.availableAt > now) continue;

			transaction.releasedAt = now;
			this.balanceLocked = Money.fromCents(this.balanceLocked).subtract(
				Money.fromCents(transaction.amount),
			).cents;
			this.balanceWithdrawable = Money.fromCents(this.balanceWithdrawable).add(
				Money.fromCents(transaction.amount),
			).cents;
		}
	}

	releaseOrderCompletionFunds(input: { orderId: string; now: Date }): void {
		for (const transaction of this.transactions) {
			if (transaction.type !== 'credit') continue;
			if (transaction.orderId !== input.orderId) continue;
			if (transaction.releasedAt) continue;
			if (transaction.availableAt > input.now) continue;

			transaction.releasedAt = input.now;
			this.balanceLocked = Money.fromCents(this.balanceLocked).subtract(
				Money.fromCents(transaction.amount),
			).cents;
			this.balanceWithdrawable = Money.fromCents(this.balanceWithdrawable).add(
				Money.fromCents(transaction.amount),
			).cents;
		}
	}

	withdraw(input: WithdrawInput): void {
		this.assertPositiveAmount(input.amount);

		if (input.amount > this.balanceWithdrawable)
			throw new WalletInsufficientWithdrawableBalanceError();

		this.balanceWithdrawable = Money.fromCents(
			this.balanceWithdrawable,
		).subtract(Money.fromCents(input.amount)).cents;
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
		if (!Number.isInteger(amount) || amount <= 0)
			throw new WalletInvalidAmountError();
	}
}
