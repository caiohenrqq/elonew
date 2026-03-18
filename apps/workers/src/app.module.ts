import 'reflect-metadata';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { WalletFundsReleaseModule } from '@modules/wallet-funds-release/wallet-funds-release.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule, WalletFundsReleaseModule],
})
export class AppModule {}
