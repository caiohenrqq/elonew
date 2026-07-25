import type { ProcessWalletFundsReleaseJobInput } from '@modules/wallet-funds-release/application/process-wallet-funds-release-job.input';

export const WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY = Symbol(
	'WALLET_FUNDS_RELEASE_EXECUTOR_PORT_KEY',
);

export type WalletFundsReleaseExecutionResult = {
	apiStatus: number;
	apiRequestId: string;
};

export interface WalletFundsReleaseExecutorPort {
	execute(
		input: ProcessWalletFundsReleaseJobInput,
	): Promise<WalletFundsReleaseExecutionResult>;
}
