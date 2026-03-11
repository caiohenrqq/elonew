import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { SystemModule } from '@modules/system/system.module';
import { UsersModule } from '@modules/users/users.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiDomainErrorFilter } from './common/http/api-domain-error.filter';
import { AppSettingsModule } from './common/settings/app-settings.module';

@Module({
	imports: [
		AppSettingsModule,
		ThrottlerModule.forRootAsync({
			inject: [AppSettingsService],
			useFactory: (appSettings: AppSettingsService) => [
				{
					name: 'default',
					ttl:
						Math.max(
							appSettings.usersConfirmEmailThrottleTtlSeconds,
							appSettings.usersSignUpThrottleTtlSeconds,
						) * 1000,
					limit: Math.max(
						appSettings.usersConfirmEmailThrottleLimit,
						appSettings.usersSignUpThrottleLimit,
					),
				},
			],
		}),
		OrdersModule,
		PaymentsModule,
		SystemModule,
		UsersModule,
		WalletModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_FILTER,
			useClass: ApiDomainErrorFilter,
		},
	],
})
export class AppModule {}
