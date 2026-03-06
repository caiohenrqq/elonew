import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule],
	controllers: [OrdersController],
	providers: [
		PrismaService,
		PrismaOrderRepository,
		{
			provide: ORDER_REPOSITORY_KEY,
			useExisting: PrismaOrderRepository,
		},
		CreateOrderUseCase,
		GetOrderUseCase,
		MarkOrderAsPaidUseCase,
		AcceptOrderUseCase,
		CancelOrderUseCase,
	],
	exports: [ORDER_REPOSITORY_KEY],
})
export class OrdersModule {}
