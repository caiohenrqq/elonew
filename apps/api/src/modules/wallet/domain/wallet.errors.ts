export class WalletInvalidAmountError extends Error {
	constructor() {
		super('Wallet amount must be greater than zero.');
	}
}

export class WalletInsufficientWithdrawableBalanceError extends Error {
	constructor() {
		super('Wallet does not have enough withdrawable balance.');
	}
}
