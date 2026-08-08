import { randomUUID } from 'node:crypto';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
} from '@modules/wallet/domain/wallet.errors';
import { Money } from '@packages/shared/money/money';

export type WalletTransactionType = 'credit' | 'debit';

export type WalletTransactionReason = 'order_completion' | 'withdrawal_request';

export type WalletTransactionReleaseSource = 'schedule' | 'admin';

export type WalletTransaction = {
	id: string;
	orderId: string | null;
	amount: number;
	type: WalletTransactionType;
	reason: WalletTransactionReason;
	payoutPixKey: string | null;
	availableAt: Date;
	releasedAt: Date | null;
	releasedBy: WalletTransactionReleaseSource | null;
	createdAt: Date;
};

export type WalletReleaseResult = {
	releasedAmount: number;
	releasedCount: number;
};

type CreditLockedInput = {
	orderId: string;
	amount: number;
	availableAt: Date;
	createdAt: Date;
};

type WithdrawInput = {
	amount: number;
	payoutPixKey: string;
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
			id: randomUUID(),
			orderId: input.orderId,
			amount: input.amount,
			type: 'credit',
			reason: 'order_completion',
			payoutPixKey: null,
			availableAt: input.availableAt,
			releasedAt: null,
			releasedBy: null,
			createdAt: input.createdAt,
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

	releaseOrderCompletionFunds(input: {
		orderId: string;
		now: Date;
	}): WalletReleaseResult {
		return this.releaseCredits({ ...input, source: 'schedule' });
	}

	// The admin override answers for the maturity window itself, so it releases
	// credits the schedule would still be holding.
	forceReleaseOrderCompletionFunds(input: {
		orderId: string;
		now: Date;
	}): WalletReleaseResult {
		return this.releaseCredits({
			...input,
			source: 'admin',
			ignoreMaturity: true,
		});
	}

	private releaseCredits(input: {
		orderId: string;
		now: Date;
		source: WalletTransactionReleaseSource;
		ignoreMaturity?: boolean;
	}): WalletReleaseResult {
		const result: WalletReleaseResult = {
			releasedAmount: 0,
			releasedCount: 0,
		};

		for (const transaction of this.transactions) {
			if (transaction.type !== 'credit') continue;
			if (transaction.orderId !== input.orderId) continue;
			if (transaction.releasedAt) continue;
			if (!input.ignoreMaturity && transaction.availableAt > input.now)
				continue;

			transaction.releasedAt = input.now;
			transaction.releasedBy = input.source;
			this.balanceLocked = Money.fromCents(this.balanceLocked).subtract(
				Money.fromCents(transaction.amount),
			).cents;
			this.balanceWithdrawable = Money.fromCents(this.balanceWithdrawable).add(
				Money.fromCents(transaction.amount),
			).cents;
			result.releasedAmount = Money.fromCents(result.releasedAmount).add(
				Money.fromCents(transaction.amount),
			).cents;
			result.releasedCount += 1;
		}

		return result;
	}

	withdraw(input: WithdrawInput): void {
		this.assertPositiveAmount(input.amount);

		if (input.amount > this.balanceWithdrawable)
			throw new WalletInsufficientWithdrawableBalanceError();

		this.balanceWithdrawable = Money.fromCents(
			this.balanceWithdrawable,
		).subtract(Money.fromCents(input.amount)).cents;
		this.transactions.unshift({
			id: randomUUID(),
			orderId: null,
			amount: input.amount,
			type: 'debit',
			reason: 'withdrawal_request',
			payoutPixKey: input.payoutPixKey,
			availableAt: input.requestedAt,
			releasedAt: input.requestedAt,
			releasedBy: null,
			createdAt: input.requestedAt,
		});
	}

	private assertPositiveAmount(amount: number): void {
		if (!Number.isInteger(amount) || amount <= 0)
			throw new WalletInvalidAmountError();
	}
}
