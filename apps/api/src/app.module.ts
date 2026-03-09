import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { SystemModule } from '@modules/system/system.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';
import { AppSettingsModule } from './common/settings/app-settings.module';

@Module({
	imports: [
		AppSettingsModule,
		OrdersModule,
		PaymentsModule,
		SystemModule,
		WalletModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
