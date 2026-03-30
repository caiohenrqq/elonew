import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { AuthModule } from '@modules/auth/auth.module';
import { BOOSTER_USER_READER_KEY } from '@modules/orders/application/ports/booster-user-reader.port';
import { COUPON_LOOKUP_PORT_KEY } from '@modules/orders/application/ports/coupon-lookup.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import {
	ApplyOrderCouponService,
	ORDER_COUPON_SERVICE_KEY,
} from '@modules/orders/application/services/order-coupon.service';
import { ORDER_PRICING_SERVICE_KEY } from '@modules/orders/application/services/order-pricing.service';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { ClearOrderCredentialsUseCase } from '@modules/orders/application/use-cases/clear-order-credentials/clear-order-credentials.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { CreateOrderQuoteUseCase } from '@modules/orders/application/use-cases/create-order-quote/create-order-quote.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import { StaticOrderPricingService } from '@modules/orders/infrastructure/pricing/static-order-pricing.service';
import { PrismaBoosterUserReader } from '@modules/orders/infrastructure/repositories/prisma-booster-user.reader';
import { PrismaCouponLookupRepository } from '@modules/orders/infrastructure/repositories/prisma-coupon-lookup.repository';
import { PrismaOrderRepository } from '@modules/orders/infrastructure/repositories/prisma-order.repository';
import { PrismaOrderCheckoutRepository } from '@modules/orders/infrastructure/repositories/prisma-order-checkout.repository';
import { PrismaOrderQuoteRepository } from '@modules/orders/infrastructure/repositories/prisma-order-quote.repository';
import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { WalletModule } from '@modules/wallet/wallet.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule, AuthModule, WalletModule],
	controllers: [OrdersController],
	providers: [
		PrismaService,
		PrismaBoosterUserReader,
		PrismaCouponLookupRepository,
		PrismaOrderCheckoutRepository,
		PrismaOrderRepository,
		PrismaOrderQuoteRepository,
		OrderCredentialsCipherService,
		{
			provide: BOOSTER_USER_READER_KEY,
			useExisting: PrismaBoosterUserReader,
		},
		{
			provide: COUPON_LOOKUP_PORT_KEY,
			useExisting: PrismaCouponLookupRepository,
		},
		ApplyOrderCouponService,
		{
			provide: ORDER_COUPON_SERVICE_KEY,
			useExisting: ApplyOrderCouponService,
		},
		{
			provide: ORDER_REPOSITORY_KEY,
			useExisting: PrismaOrderRepository,
		},
		{
			provide: ORDER_CHECKOUT_PORT_KEY,
			useExisting: PrismaOrderCheckoutRepository,
		},
		StaticOrderPricingService,
		{
			provide: ORDER_PRICING_SERVICE_KEY,
			useExisting: StaticOrderPricingService,
		},
		{
			provide: ORDER_QUOTE_REPOSITORY_KEY,
			useExisting: PrismaOrderQuoteRepository,
		},
		CreateOrderQuoteUseCase,
		CreateOrderUseCase,
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
