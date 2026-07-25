import { randomUUID } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	type WalletFundsReleaseExecutionResult,
	type WalletFundsReleaseExecutorPort,
} from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import type { ProcessWalletFundsReleaseJobInput } from '@modules/wallet-funds-release/application/process-wallet-funds-release-job.input';
import { WalletFundsReleaseExecutionFailedError } from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
import { Inject, Injectable } from '@nestjs/common';
import { WALLET_FUNDS_RELEASE_INTERNAL_ROUTE } from '@packages/shared/wallet/wallet-funds-release.contract';

@Injectable()
export class InternalApiWalletFundsReleaseExecutorAdapter
	implements WalletFundsReleaseExecutorPort
{
	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
	) {}

	async execute(
		input: ProcessWalletFundsReleaseJobInput,
	): Promise<WalletFundsReleaseExecutionResult> {
		// The API echoes this id back, so one attempt can be followed across both
		// services' logs.
		const requestId = randomUUID();

		try {
			const response = await fetch(
				`${this.appSettings.apiInternalBaseUrl}${WALLET_FUNDS_RELEASE_INTERNAL_ROUTE}`,
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'x-internal-api-key': this.appSettings.internalApiKey,
						'x-request-id': requestId,
					},
					body: JSON.stringify({
						orderId: input.orderId,
						boosterId: input.boosterId,
						// The release happens now, not when the job was due: a job that
						// ran late must not backdate the ledger.
						now: new Date().toISOString(),
					}),
				},
			);

			if (!response.ok)
				throw new WalletFundsReleaseExecutionFailedError(
					`Wallet release request failed with status ${response.status}.`,
					response.status,
				);

			return {
				apiStatus: response.status,
				apiRequestId: response.headers.get('x-request-id') ?? requestId,
			};
		} catch (error) {
			if (error instanceof WalletFundsReleaseExecutionFailedError) throw error;

			const message =
				error instanceof Error ? error.message : 'Unknown transport failure';
			throw new WalletFundsReleaseExecutionFailedError(
				`Wallet release request failed: ${message}.`,
			);
		}
	}
}
