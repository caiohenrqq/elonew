import { AuthModule } from '@modules/auth/auth.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { SystemModule } from '@modules/system/system.module';
import { UsersModule } from '@modules/users/users.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApiDomainErrorFilter } from './common/http/api-domain-error.filter';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppSettingsModule } from './common/settings/app-settings.module';

@Module({
	imports: [
		AppSettingsModule,
		PrismaModule,
		AuthModule,
		OrdersModule,
		PaymentsModule,
		SystemModule,
		UsersModule,
		WalletModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: ApiDomainErrorFilter,
		},
	],
})
export class AppModule {}
