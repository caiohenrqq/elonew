import { OrdersModule } from '@modules/orders/orders.module';
import { ORDER_STATUS_PORT_KEY } from '@modules/payments/application/ports/order-status.port';
import { PAYMENT_REPOSITORY_KEY } from '@modules/payments/application/ports/payment-repository.port';
import { PROCESSED_WEBHOOK_EVENT_PORT_KEY } from '@modules/payments/application/ports/processed-webhook-event.port';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold.use-case';
import { OrderStatusFromOrdersRepositoryGateway } from '@modules/payments/infrastructure/gateways/order-status-from-orders-repository.gateway';
import { InMemoryPaymentRepository } from '@modules/payments/infrastructure/repositories/in-memory-payment.repository';
import { InMemoryProcessedWebhookEventRepository } from '@modules/payments/infrastructure/repositories/in-memory-processed-webhook-event.repository';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [OrdersModule],
	controllers: [PaymentsController],
	providers: [
		InMemoryPaymentRepository,
		{
			provide: PAYMENT_REPOSITORY_KEY,
			useExisting: InMemoryPaymentRepository,
		},
		InMemoryProcessedWebhookEventRepository,
		{
			provide: PROCESSED_WEBHOOK_EVENT_PORT_KEY,
			useExisting: InMemoryProcessedWebhookEventRepository,
		},
		OrderStatusFromOrdersRepositoryGateway,
		{
			provide: ORDER_STATUS_PORT_KEY,
			useExisting: OrderStatusFromOrdersRepositoryGateway,
		},
		CreatePaymentUseCase,
		GetPaymentUseCase,
		ConfirmPaymentUseCase,
		HandlePaymentConfirmedWebhookUseCase,
		ReleasePaymentHoldUseCase,
	],
})
export class PaymentsModule {}
