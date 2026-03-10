import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule, AuthModule, WalletModule],
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
		RejectOrderUseCase,
		CancelOrderUseCase,
		CompleteOrderUseCase,
		SaveOrderCredentialsUseCase,
	],
	exports: [ORDER_REPOSITORY_KEY, MarkOrderAsPaidUseCase],
})
export class OrdersModule {}
