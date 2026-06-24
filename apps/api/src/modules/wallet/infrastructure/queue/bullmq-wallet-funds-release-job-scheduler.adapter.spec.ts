import {
	createWalletFundsReleaseJobId,
	WALLET_FUNDS_RELEASE_JOB_OPTIONS,
} from '@modules/wallet/infrastructure/queue/bullmq-wallet-funds-release-job-scheduler.adapter';

describe('createWalletFundsReleaseJobId', () => {
	it('builds a BullMQ-safe job id without colons', () => {
		const jobId = createWalletFundsReleaseJobId({
			boosterId: 'booster-1',
			orderId: 'order-1',
		});

		expect(jobId).toBe('booster-1__order-1');
		expect(jobId.includes(':')).toBe(false);
	});
});

describe('WALLET_FUNDS_RELEASE_JOB_OPTIONS', () => {
	it('retries temporary failures with exponential backoff', () => {
		expect(WALLET_FUNDS_RELEASE_JOB_OPTIONS).toEqual({
			attempts: 5,
			backoff: {
				type: 'exponential',
				delay: 5_000,
			},
			removeOnComplete: 100,
			removeOnFail: 100,
		});
	});
});
