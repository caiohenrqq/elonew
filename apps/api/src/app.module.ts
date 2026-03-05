import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { SystemModule } from '@modules/system/system.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [OrdersModule, PaymentsModule, SystemModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
