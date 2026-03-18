export const WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY = Symbol(
	'WALLET_FUNDS_RELEASE_JOB_SCHEDULER_PORT_KEY',
);

export interface WalletFundsReleaseJobSchedulerPort {
	scheduleRelease(input: {
		orderId: string;
		boosterId: string;
		availableAt: Date;
	}): Promise<void>;
}
