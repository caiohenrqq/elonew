import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { BOOSTER_USER_READER_KEY } from '@modules/orders/application/ports/booster-user-reader.port';
import { COUPON_LOOKUP_PORT_KEY } from '@modules/orders/application/ports/coupon-lookup.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_PRICING_VERSION_REPOSITORY_KEY } from '@modules/orders/application/ports/order-pricing-version-repository.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import {
	ApplyOrderCouponService,
	ORDER_COUPON_SERVICE_KEY,
} from '@modules/orders/application/services/order-coupon.service';
import { ORDER_PRICING_SERVICE_KEY } from '@modules/orders/application/services/order-pricing.service';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { ActivateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/activate-order-pricing-version/activate-order-pricing-version.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { ClearOrderCredentialsUseCase } from '@modules/orders/application/use-cases/clear-order-credentials/clear-order-credentials.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { CreateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/create-order-pricing-version/create-order-pricing-version.use-case';
import { CreateOrderQuoteUseCase } from '@modules/orders/application/use-cases/create-order-quote/create-order-quote.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { GetOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/get-order-pricing-version/get-order-pricing-version.use-case';
import { ListOrderPricingVersionsUseCase } from '@modules/orders/application/use-cases/list-order-pricing-versions/list-order-pricing-versions.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import { UpdateOrderPricingVersionUseCase } from '@modules/orders/application/use-cases/update-order-pricing-version/update-order-pricing-version.use-case';
import { VersionedOrderPricingService } from '@modules/orders/infrastructure/pricing/versioned-order-pricing.service';
import { PrismaBoosterUserReader } from '@modules/orders/infrastructure/repositories/prisma-booster-user.reader';
import { PrismaCouponLookupRepository } from '@modules/orders/infrastructure/repositories/prisma-coupon-lookup.repository';
import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';
import { PrismaOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/prisma-order-checkout.repository';
import { PrismaOrderPricingVersionRepository } from '@modules/orders/infrastructure/repositories/prisma-order-pricing-version.repository';
import { PrismaOrderQuoteRepository } from '@modules/orders/infrastructure/repositories/prisma-order-quote.repository';
import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { OrdersPricingAdminController } from '@modules/orders/presentation/orders-pricing-admin.controller';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, AuthModule, WalletModule],
	controllers: [OrdersController, OrdersPricingAdminController],
	providers: [
		PrismaBoosterUserReader,
		PrismaCouponLookupRepository,
		PrismaOrderCheckoutRepository,
		PrismaOrderPricingVersionRepository,
		PrismaOrderRepository,
		PrismaOrderQuoteRepository,
		OrderCredentialsCipherService,
		{
			provide: BOOSTER_USER_READER_KEY,
			useFactory: (
				boosterUserReader: PrismaBoosterUserReader,
			): PrismaBoosterUserReader => boosterUserReader,
			inject: [PrismaBoosterUserReader],
		},
		{
			provide: COUPON_LOOKUP_PORT_KEY,
			useFactory: (
				couponLookupRepository: PrismaCouponLookupRepository,
			): PrismaCouponLookupRepository => couponLookupRepository,
			inject: [PrismaCouponLookupRepository],
		},
		ApplyOrderCouponService,
		{
			provide: ORDER_COUPON_SERVICE_KEY,
			useFactory: (
				orderCouponService: ApplyOrderCouponService,
			): ApplyOrderCouponService => orderCouponService,
			inject: [ApplyOrderCouponService],
		},
		{
			provide: ORDER_REPOSITORY_KEY,
			useFactory: (
				orderRepository: PrismaOrderRepository,
			): PrismaOrderRepository => orderRepository,
			inject: [PrismaOrderRepository],
		},
		{
			provide: ORDER_CHECKOUT_PORT_KEY,
			useFactory: (
				orderCheckoutRepository: PrismaOrderCheckoutRepository,
			): PrismaOrderCheckoutRepository => orderCheckoutRepository,
			inject: [PrismaOrderCheckoutRepository],
		},
		{
			provide: ORDER_PRICING_VERSION_REPOSITORY_KEY,
			useFactory: (
				orderPricingVersionRepository: PrismaOrderPricingVersionRepository,
			): PrismaOrderPricingVersionRepository => orderPricingVersionRepository,
			inject: [PrismaOrderPricingVersionRepository],
		},
		VersionedOrderPricingService,
		{
			provide: ORDER_PRICING_SERVICE_KEY,
			useFactory: (
				orderPricingService: VersionedOrderPricingService,
			): VersionedOrderPricingService => orderPricingService,
			inject: [VersionedOrderPricingService],
		},
		{
			provide: ORDER_QUOTE_REPOSITORY_KEY,
			useFactory: (
				orderQuoteRepository: PrismaOrderQuoteRepository,
			): PrismaOrderQuoteRepository => orderQuoteRepository,
			inject: [PrismaOrderQuoteRepository],
		},
		CreateOrderQuoteUseCase,
		CreateOrderPricingVersionUseCase,
		CreateOrderUseCase,
		ListOrderPricingVersionsUseCase,
		GetOrderPricingVersionUseCase,
		UpdateOrderPricingVersionUseCase,
		ActivateOrderPricingVersionUseCase,
		GetOrderUseCase,
		MarkOrderAsPaidUseCase,
		AcceptOrderUseCase,
		RejectOrderUseCase,
		CancelOrderUseCase,
		ClearOrderCredentialsUseCase,
		CompleteOrderUseCase,
		SaveOrderCredentialsUseCase,
	],
	exports: [
		ORDER_REPOSITORY_KEY,
		MarkOrderAsPaidUseCase,
		ClearOrderCredentialsUseCase,
	],
})
export class OrdersModule {}
