import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type WalletFundsReleaseExecutorPort } from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
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

	async execute(input: ProcessWalletFundsReleaseJobInput): Promise<void> {
		try {
			const response = await fetch(
				`${this.appSettings.apiInternalBaseUrl}${WALLET_FUNDS_RELEASE_INTERNAL_ROUTE}`,
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						orderId: input.orderId,
						boosterId: input.boosterId,
						now: input.availableAt.toISOString(),
					}),
				},
			);

			if (!response.ok)
				throw new WalletFundsReleaseExecutionFailedError(
					`Wallet release request failed with status ${response.status}.`,
				);
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
