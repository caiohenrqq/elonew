import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { AuthModule } from '@modules/auth/auth.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { ORDER_CREDENTIAL_CLEANUP_PORT_KEY } from '@modules/payments/application/ports/order-credential-cleanup.port';
import { ORDER_PAYMENT_AMOUNT_PORT_KEY } from '@modules/payments/application/ports/order-payment-amount.port';
import { ORDER_PAYMENT_CONFIRMATION_PORT_KEY } from '@modules/payments/application/ports/order-payment-confirmation.port';
import { ORDER_STATUS_PORT_KEY } from '@modules/payments/application/ports/order-status.port';
import { PAYMENT_GATEWAY_PORT_KEY } from '@modules/payments/application/ports/payment-gateway.port';
import { PAYMENT_REPOSITORY_KEY } from '@modules/payments/application/ports/payment-repository.port';
import { PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY } from '@modules/payments/application/ports/payment-webhook-signature-verifier.port';
import { PROCESSED_WEBHOOK_EVENT_PORT_KEY } from '@modules/payments/application/ports/processed-webhook-event.port';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { MercadoPagoPaymentGatewayAdapter } from '@modules/payments/infrastructure/adapters/mercadopago-payment-gateway.adapter';
import { MercadoPagoPaymentWebhookSignatureVerifierAdapter } from '@modules/payments/infrastructure/adapters/mercadopago-payment-webhook-signature-verifier.adapter';
import { OrderCredentialCleanupFromOrdersAdapter } from '@modules/payments/infrastructure/adapters/order-credential-cleanup-from-orders.adapter';
import { OrderPaymentAmountFromPrismaAdapter } from '@modules/payments/infrastructure/adapters/order-payment-amount-from-prisma.adapter';
import { OrderPaymentConfirmationFromOrdersAdapter } from '@modules/payments/infrastructure/adapters/order-payment-confirmation-from-orders.adapter';
import { OrderStatusFromPrismaAdapter } from '@modules/payments/infrastructure/adapters/order-status-from-prisma.adapter';
import { PrismaPaymentRepository } from '@modules/payments/infrastructure/repositories/prisma-payment.repository';
import { PrismaProcessedWebhookEventRepository } from '@modules/payments/infrastructure/repositories/prisma-processed-webhook-event.repository';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';
import { Module } from '@nestjs/common';
import { MercadoPagoSdkAdapter } from '@packages/integrations/mercadopago/mercadopago-sdk.adapter';
import { MERCADO_PAGO_SDK_PORT_KEY } from '@packages/integrations/mercadopago/mercadopago-sdk.port';

@Module({
	imports: [PrismaModule, AuthModule, OrdersModule],
	controllers: [PaymentsController],
	providers: [
		PrismaPaymentRepository,
		{
			provide: PAYMENT_REPOSITORY_KEY,
			useFactory: (
				paymentRepository: PrismaPaymentRepository,
			): PrismaPaymentRepository => paymentRepository,
			inject: [PrismaPaymentRepository],
		},
		PrismaProcessedWebhookEventRepository,
		{
			provide: PROCESSED_WEBHOOK_EVENT_PORT_KEY,
			useFactory: (
				processedWebhookEventRepository: PrismaProcessedWebhookEventRepository,
			): PrismaProcessedWebhookEventRepository =>
				processedWebhookEventRepository,
			inject: [PrismaProcessedWebhookEventRepository],
		},
		{
			provide: MERCADO_PAGO_SDK_PORT_KEY,
			useFactory: (appSettings: AppSettingsService) =>
				new MercadoPagoSdkAdapter({
					accessToken: appSettings.mercadoPagoAccessToken,
					webhookSecret: appSettings.mercadoPagoWebhookSecret,
					webhookUrl: appSettings.mercadoPagoWebhookUrl,
				}),
			inject: [AppSettingsService],
		},
		MercadoPagoPaymentGatewayAdapter,
		{
			provide: PAYMENT_GATEWAY_PORT_KEY,
			useFactory: (
				paymentGateway: MercadoPagoPaymentGatewayAdapter,
			): MercadoPagoPaymentGatewayAdapter => paymentGateway,
			inject: [MercadoPagoPaymentGatewayAdapter],
		},
		OrderStatusFromPrismaAdapter,
		{
			provide: ORDER_STATUS_PORT_KEY,
			useFactory: (
				orderStatusPort: OrderStatusFromPrismaAdapter,
			): OrderStatusFromPrismaAdapter => orderStatusPort,
			inject: [OrderStatusFromPrismaAdapter],
		},
		OrderPaymentAmountFromPrismaAdapter,
		{
			provide: ORDER_PAYMENT_AMOUNT_PORT_KEY,
			useFactory: (
				orderPaymentAmountPort: OrderPaymentAmountFromPrismaAdapter,
			): OrderPaymentAmountFromPrismaAdapter => orderPaymentAmountPort,
			inject: [OrderPaymentAmountFromPrismaAdapter],
		},
		OrderPaymentConfirmationFromOrdersAdapter,
		{
			provide: ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
			useFactory: (
				orderPaymentConfirmationPort: OrderPaymentConfirmationFromOrdersAdapter,
			): OrderPaymentConfirmationFromOrdersAdapter =>
				orderPaymentConfirmationPort,
			inject: [OrderPaymentConfirmationFromOrdersAdapter],
		},
		OrderCredentialCleanupFromOrdersAdapter,
		{
			provide: ORDER_CREDENTIAL_CLEANUP_PORT_KEY,
			useFactory: (
				orderCredentialCleanupPort: OrderCredentialCleanupFromOrdersAdapter,
			): OrderCredentialCleanupFromOrdersAdapter => orderCredentialCleanupPort,
			inject: [OrderCredentialCleanupFromOrdersAdapter],
		},
		MercadoPagoPaymentWebhookSignatureVerifierAdapter,
		{
			provide: PAYMENT_WEBHOOK_SIGNATURE_VERIFIER_PORT_KEY,
			useFactory: (
				paymentWebhookSignatureVerifier: MercadoPagoPaymentWebhookSignatureVerifierAdapter,
			): MercadoPagoPaymentWebhookSignatureVerifierAdapter =>
				paymentWebhookSignatureVerifier,
			inject: [MercadoPagoPaymentWebhookSignatureVerifierAdapter],
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
