import { createWalletFundsReleaseJobId } from '@modules/wallet/infrastructure/queue/bullmq-wallet-funds-release-job-scheduler.adapter';

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
