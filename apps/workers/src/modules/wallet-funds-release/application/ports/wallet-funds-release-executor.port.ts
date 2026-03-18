import type { WalletFundsReleaseJob } from '@shared/wallet/wallet-funds-release-job';

export const WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY = Symbol(
	'WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY',
);

export interface WalletFundsReleaseExecutorPort {
	execute(input: WalletFundsReleaseJob): Promise<void>;
}
