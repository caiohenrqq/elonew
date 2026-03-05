import { OrdersModule } from '@modules/orders/orders.module';
import { SystemModule } from '@modules/system/system.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [OrdersModule, SystemModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
