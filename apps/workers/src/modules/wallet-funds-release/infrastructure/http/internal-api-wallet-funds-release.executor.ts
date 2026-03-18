import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { type WalletFundsReleaseExecutorPort } from '@modules/wallet-funds-release/application/ports/wallet-funds-release-executor.port';
import { Injectable } from '@nestjs/common';
import { WALLET_FUNDS_RELEASE_INTERNAL_ROUTE } from '@shared/wallet/wallet-funds-release.contract';
import type { WalletFundsReleaseJob } from '@shared/wallet/wallet-funds-release-job';

@Injectable()
export class InternalApiWalletFundsReleaseExecutorAdapter
	implements WalletFundsReleaseExecutorPort
{
	constructor(private readonly appSettings: AppSettingsService) {}

	async execute(input: WalletFundsReleaseJob): Promise<void> {
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
					now: input.availableAt,
				}),
			},
		);

		if (!response.ok)
			throw new Error(
				`Wallet release request failed with status ${response.status}.`,
			);
	}
}
