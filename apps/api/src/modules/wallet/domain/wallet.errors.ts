import {
	BadRequestDomainError,
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
