import 'reflect-metadata';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { ScheduledTasksModule } from '@modules/scheduled-tasks/scheduled-tasks.module';
import { WalletFundsReleaseModule } from '@modules/wallet-funds-release/wallet-funds-release.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule, WalletFundsReleaseModule, ScheduledTasksModule],
})
export class AppModule {}
