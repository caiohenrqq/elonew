import { EmailModule } from '@app/common/email/email.module';
import { LoggingModule } from '@app/common/logging/logging.module';
import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ChatModule } from '@modules/chat/chat.module';
import { CouponLifecycleLogger } from '@modules/orders/application/logging/coupon-lifecycle.logger';
import { OrderQuoteCleanupLifecycleLogger } from '@modules/orders/application/logging/order-quote-cleanup-lifecycle.logger';
import { BOOSTER_ORDER_READER_KEY } from '@modules/orders/application/ports/booster-order-reader.port';
import { BOOSTER_USER_READER_KEY } from '@modules/orders/application/ports/booster-user-reader.port';
import { CLIENT_ORDER_READER_KEY } from '@modules/orders/application/ports/client-order-reader.port';
import { COUPON_ADMIN_REPOSITORY_KEY } from '@modules/orders/application/ports/coupon-admin-repository.port';
import { COUPON_EVENT_RECORDER_KEY } from '@modules/orders/application/ports/coupon-event-recorder.port';
import { COUPON_LOOKUP_PORT_KEY } from '@modules/orders/application/ports/coupon-lookup.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_CLIENT_READER_KEY } from '@modules/orders/application/ports/order-client-reader.port';
import { ORDER_EVENT_PUBLISHER_KEY } from '@modules/orders/application/ports/order-event-publisher.port';
import { ORDER_PRICING_VERSION_REPOSITORY_KEY } from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import {
	ApplyOrderCouponService,
	ORDER_COUPON_SERVICE_KEY,
} from '@modules/orders/application/services/order-coupon.service';
import { OrderLifecycleEmailService } from '@modules/orders/application/services/order-lifecycle-email.service';
import { ORDER_PRICING_SERVICE_KEY } from '@modules/orders/application/services/order-pricing.service';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { ActivateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/activate-order-pricing-version/activate-order-pricing-version.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CleanupExpiredOrderQuotesUseCase } from '@modules/orders/application/use-cases/cleanup-expired-order-quotes/cleanup-expired-order-quotes.use-case';
import { ClearOrderCredentialsUseCase } from '@modules/orders/application/use-cases/clear-order-credentials/clear-order-credentials.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateCouponUseCase } from '@modules/orders/application/use-cases/create-coupon/create-coupon.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { CreateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/create-order-pricing-version/create-order-pricing-version.use-case';
import { CreateOrderQuoteUseCase } from '@modules/orders/application/use-cases/create-order-quote/create-order-quote.use-case';
import { DisableCouponUseCase } from '@modules/orders/application/use-cases/disable-coupon/disable-coupon.use-case';
import { EnableCouponUseCase } from '@modules/orders/application/use-cases/enable-coupon/enable-coupon.use-case';
import { GetCouponReportUseCase } from '@modules/orders/application/use-cases/get-coupon-report/get-coupon-report.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { GetOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/get-order-pricing-version/get-order-pricing-version.use-case';
import { ListBoosterQueueUseCase } from '@modules/orders/application/use-cases/list-booster-queue/list-booster-queue.use-case';
import { ListBoosterWorkUseCase } from '@modules/orders/application/use-cases/list-booster-work/list-booster-work.use-case';
import { ListClientOrdersUseCase } from '@modules/orders/application/use-cases/list-client-orders/list-client-orders.use-case';
import { ListCouponsUseCase } from '@modules/orders/application/use-cases/list-coupons/list-coupons.use-case';
import { ListOrderPricingVersionsUseCase } from '@modules/orders/application/use-cases/list-order-pricing-versions/list-order-pricing-versions.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { PreviewOrderQuoteUseCase } from '@modules/orders/application/use-cases/preview-order-quote/preview-order-quote.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import { UpdateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/update-order-pricing-version/update-order-pricing-version.use-case';
import { InMemoryOrderEventBus } from '@modules/orders/infrastructure/events/in-memory-order-event-bus';
import { VersionedOrderPricingService } from '@modules/orders/infrastructure/pricing/versioned-order-pricing.service';
import { PrismaBoosterUserReader } from '@modules/orders/infrastructure/repositories/prisma-booster-user.reader';
import { PrismaCouponAdminRepository } from '@modules/orders/infrastructure/repositories/prisma-coupon-admin.repository';
import { PrismaCouponEventRecorder } from '@modules/orders/infrastructure/repositories/prisma-coupon-event-recorder.repository';
import { PrismaCouponLookupRepository } from '@modules/orders/infrastructure/repositories/prisma-coupon-lookup.repository';
import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';
import { PrismaOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/prisma-order-checkout.repository';
import { PrismaOrderClientReader } from '@modules/orders/infrastructure/repositories/prisma-order-client-reader.repository';
import { PrismaOrderPricingVersionRepository } from '@modules/orders/infrastructure/repositories/prisma-order-pricing-version.repository';
import { PrismaOrderQuoteRepository } from '@modules/orders/infrastructure/repositories/prisma-order-quote.repository';
import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';
import { CouponsAdminController } from '@modules/orders/presentation/coupons-admin.controller';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { OrdersEventsController } from '@modules/orders/presentation/orders-events.controller';
import { OrdersPricingAdminController } from '@modules/orders/presentation/orders-pricing-admin.controller';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		PrismaModule,
		AuthModule,
		ChatModule,
		WalletModule,
		LoggingModule,
		EmailModule,
	],
	controllers: [
		OrdersEventsController,
		OrdersController,
		OrdersPricingAdminController,
		CouponsAdminController,
	],
	providers: [
		PrismaBoosterUserReader,
		PrismaCouponLookupRepository,
		PrismaCouponAdminRepository,
		PrismaCouponEventRecorder,
		PrismaOrderClientReader,
		PrismaOrderCheckoutRepository,
		PrismaOrderPricingVersionRepository,
		PrismaOrderRepository,
		PrismaOrderQuoteRepository,
		OrderQuoteCleanupLifecycleLogger,
		CouponLifecycleLogger,
		InMemoryOrderEventBus,
		OrderCredentialsCipherService,
		{
			provide: BOOSTER_USER_READER_KEY,
			useExisting: PrismaBoosterUserReader,
		},
		{
			provide: COUPON_LOOKUP_PORT_KEY,
			useExisting: PrismaCouponLookupRepository,
		},
		{
			provide: COUPON_ADMIN_REPOSITORY_KEY,
			useExisting: PrismaCouponAdminRepository,
		},
		{
			provide: COUPON_EVENT_RECORDER_KEY,
			useExisting: PrismaCouponEventRecorder,
		},
		{
			provide: ORDER_CLIENT_READER_KEY,
			useExisting: PrismaOrderClientReader,
		},
		ApplyOrderCouponService,
		OrderLifecycleEmailService,
		{
			provide: ORDER_COUPON_SERVICE_KEY,
			useExisting: ApplyOrderCouponService,
		},
		{
			provide: ORDER_REPOSITORY_KEY,
			useExisting: PrismaOrderRepository,
		},
		{
			provide: ORDER_EVENT_PUBLISHER_KEY,
			useExisting: InMemoryOrderEventBus,
		},
		{
			provide: CLIENT_ORDER_READER_KEY,
			useExisting: PrismaOrderRepository,
		},
		{
			provide: BOOSTER_ORDER_READER_KEY,
			useExisting: PrismaOrderRepository,
		},
		{
			provide: ORDER_CHECKOUT_PORT_KEY,
			useExisting: PrismaOrderCheckoutRepository,
		},
		{
			provide: ORDER_PRICING_VERSION_REPOSITORY_KEY,
			useExisting: PrismaOrderPricingVersionRepository,
		},
		VersionedOrderPricingService,
		{
			provide: ORDER_PRICING_SERVICE_KEY,
			useExisting: VersionedOrderPricingService,
		},
		{
			provide: ORDER_QUOTE_REPOSITORY_KEY,
			useExisting: PrismaOrderQuoteRepository,
		},
		CreateOrderQuoteUseCase,
		CreateCouponUseCase,
		ListCouponsUseCase,
		DisableCouponUseCase,
		EnableCouponUseCase,
		GetCouponReportUseCase,
		CreateOrderPricingVersionUseCase,
		CreateOrderUseCase,
		ListOrderPricingVersionsUseCase,
		GetOrderPricingVersionUseCase,
		UpdateOrderPricingVersionUseCase,
		ActivateOrderPricingVersionUseCase,
		PreviewOrderQuoteUseCase,
		ListClientOrdersUseCase,
		ListBoosterQueueUseCase,
		ListBoosterWorkUseCase,
		GetOrderUseCase,
		MarkOrderAsPaidUseCase,
		AcceptOrderUseCase,
		RejectOrderUseCase,
		CancelOrderUseCase,
		CleanupExpiredOrderQuotesUseCase,
		ClearOrderCredentialsUseCase,
		CompleteOrderUseCase,
		SaveOrderCredentialsUseCase,
	],
	exports: [
		ORDER_REPOSITORY_KEY,
		ORDER_CHECKOUT_PORT_KEY,
		MarkOrderAsPaidUseCase,
		ClearOrderCredentialsUseCase,
	],
})
export class OrdersModule {}
