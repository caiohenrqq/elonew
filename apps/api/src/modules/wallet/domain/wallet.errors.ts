import {
	BadRequestDomainError,
	ConflictDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class WalletNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Wallet not found.');
	}
}

export class WalletInvalidAmountError extends BadRequestDomainError {
	constructor() {
		super('Wallet amount must be greater than zero.');
	}
}

export class WalletInsufficientWithdrawableBalanceError extends BadRequestDomainError {
	constructor() {
		super('Wallet does not have enough withdrawable balance.');
	}
}

export class WalletOrderCompletionCreditNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Wallet has no completion credit for this order.');
	}
}

export class WalletOrderCompletionAlreadyReleasedError extends ConflictDomainError {
	constructor() {
		super('Wallet completion credit for this order was already released.');
	}
}
