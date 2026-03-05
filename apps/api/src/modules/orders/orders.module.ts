import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order.use-case';
import { ConfirmPaymentUseCase } from '@modules/orders/application/use-cases/confirm-payment.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order.use-case';
import { InMemoryOrderRepository } from '@modules/orders/infrastructure/repositories/in-memory-order.repository';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { Module } from '@nestjs/common';

@Module({
	controllers: [OrdersController],
	providers: [
		InMemoryOrderRepository,
		{
			provide: ORDER_REPOSITORY_KEY,
			useExisting: InMemoryOrderRepository,
		},
		CreateOrderUseCase,
		GetOrderUseCase,
		ConfirmPaymentUseCase,
		AcceptOrderUseCase,
		CancelOrderUseCase,
	],
})
export class OrdersModule {}
