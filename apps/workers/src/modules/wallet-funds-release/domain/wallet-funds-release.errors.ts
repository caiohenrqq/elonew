export class WalletFundsReleaseInvalidJobError extends Error {
	constructor() {
		super('Wallet funds release job payload is invalid.');
	}
}

export class WalletFundsReleaseExecutionFailedError extends Error {
	constructor(message = 'Wallet funds release execution failed.') {
		super(message);
	}
}
