import { AdminModule } from '@modules/admin/admin.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { ChatModule } from '@modules/chat/chat.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { RatingsModule } from '@modules/ratings/ratings.module';
import { SystemModule } from '@modules/system/system.module';
import { TicketsModule } from '@modules/tickets/tickets.module';
import { UsersModule } from '@modules/users/users.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiDomainErrorFilter } from './common/http/api-domain-error.filter';
import { ApiMutationThrottlerGuard } from './common/http/api-mutation-throttler.guard';
import { HttpThrottlingModule } from './common/http/http-throttling.module';
import { LoggingModule } from './common/logging/logging.module';
import { OutboxModule } from './common/outbox/outbox.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppSettingsModule } from './common/settings/app-settings.module';

@Module({
	imports: [
		AppSettingsModule,
		HttpThrottlingModule,
		LoggingModule,
		PrismaModule,
		OutboxModule,
		AdminModule,
		AuthModule,
		ChatModule,
		NotificationsModule,
		OrdersModule,
		PaymentsModule,
		RatingsModule,
		SystemModule,
		TicketsModule,
		UsersModule,
		WalletModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: ApiDomainErrorFilter,
		},
		{
			provide: APP_GUARD,
			useClass: ApiMutationThrottlerGuard,
		},
		// Order matters: authentication populates request.user, which RolesGuard
		// then checks. Both run after throttling so floods are shed first.
		{
			provide: APP_GUARD,
			useExisting: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useExisting: RolesGuard,
		},
	],
})
export class AppModule {}
