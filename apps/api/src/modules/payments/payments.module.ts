import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { ORDER_CREDENTIAL_CLEANUP_PORT_KEY } from '@modules/payments/application/ports/order-credential-cleanup.port';
import { ORDER_PAYMENT_CONFIRMATION_PORT_KEY } from '@modules/payments/application/ports/order-payment-confirmation.port';
import { ORDER_STATUS_PORT_KEY } from '@modules/payments/application/ports/order-status.port';
import { PAYMENT_REPOSITORY_KEY } from '@modules/payments/application/ports/payment-repository.port';
import { PROCESSED_WEBHOOK_EVENT_PORT_KEY } from '@modules/payments/application/ports/processed-webhook-event.port';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { OrderCredentialCleanupFromOrdersAdapter } from '@modules/payments/infrastructure/adapters/order-credential-cleanup-from-orders.adapter';
import { OrderPaymentConfirmationFromOrdersAdapter } from '@modules/payments/infrastructure/adapters/order-payment-confirmation-from-orders.adapter';
import { OrderStatusFromPrismaAdapter } from '@modules/payments/infrastructure/adapters/order-status-from-prisma.adapter';
import { PrismaPaymentRepository } from '@modules/payments/infrastructure/repositories/prisma-payment.repository';
import { PrismaProcessedWebhookEventRepository } from '@modules/payments/infrastructure/repositories/prisma-processed-webhook-event.repository';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule, OrdersModule],
	controllers: [PaymentsController],
	providers: [
		PrismaService,
		PrismaPaymentRepository,
		{
			provide: PAYMENT_REPOSITORY_KEY,
			useExisting: PrismaPaymentRepository,
		},
		PrismaProcessedWebhookEventRepository,
		{
			provide: PROCESSED_WEBHOOK_EVENT_PORT_KEY,
			useExisting: PrismaProcessedWebhookEventRepository,
		},
		OrderStatusFromPrismaAdapter,
		{
			provide: ORDER_STATUS_PORT_KEY,
			useExisting: OrderStatusFromPrismaAdapter,
		},
		OrderPaymentConfirmationFromOrdersAdapter,
		{
			provide: ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
			useExisting: OrderPaymentConfirmationFromOrdersAdapter,
		},
		OrderCredentialCleanupFromOrdersAdapter,
		{
			provide: ORDER_CREDENTIAL_CLEANUP_PORT_KEY,
			useExisting: OrderCredentialCleanupFromOrdersAdapter,
		},
		CreatePaymentUseCase,
		GetPaymentUseCase,
		ConfirmPaymentUseCase,
		FailPaymentUseCase,
		HandlePaymentConfirmedWebhookUseCase,
		ReleasePaymentHoldUseCase,
	],
})
export class PaymentsModule {}
