import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderCheckoutPort } from '@modules/orders/application/ports/order-checkout.port';
import { Order } from '@modules/orders/domain/order.entity';
import {
	OrderCouponInvalidError,
	OrderQuoteAlreadyUsedError,
	OrderQuoteExpiredError,
	OrderQuoteNotFoundError,
} from '@modules/orders/domain/order-pricing.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Injectable } from '@nestjs/common';
import { CouponDiscountType, Prisma, ServiceType } from '@prisma/client';
import type { OrderServiceType } from '@shared/orders/service-type';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type QuoteRecord = {
	id: string;
	clientId: string;
	couponId: string | null;
	serviceType: string;
	currentLeague: string;
	currentDivision: string;
	currentLp: number;
	desiredLeague: string;
	desiredDivision: string;
	server: string;
	desiredQueue: string;
	lpGain: number;
	deadline: Date;
	subtotal: number;
	totalAmount: number;
	discountAmount: number;
	expiresAt: Date;
	consumedAt: Date | null;
};

type OrderRecord = {
	id: string;
	clientId: string | null;
	boosterId: string | null;
	couponId: string | null;
	status: string;
	serviceType: string | null;
	currentLeague: string | null;
	currentDivision: string | null;
	currentLp: number | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
	server: string | null;
	desiredQueue: string | null;
	lpGain: number | null;
	deadline: Date | null;
	subtotal: number | null;
	totalAmount: number | null;
	discountAmount: number;
	credentials: null;
};

type CouponRecord = {
	id: string;
	discountType: CouponDiscountType;
	discount: number;
	isActive: boolean;
	firstOrderOnly: boolean;
};

type OrderQuoteDelegate = {
	findFirst(args: {
		where: { id: string; clientId: string };
	}): Promise<QuoteRecord | null>;
	updateMany(args: {
		where: {
			id: string;
			clientId: string;
			consumedAt: null;
			expiresAt: { gt: Date };
		};
		data: {
			consumedAt: Date;
			orderId: string;
		};
	}): Promise<{ count: number }>;
};

type OrderDelegate = {
	findFirst(args: {
		where: { clientId: string };
		select: { id: true };
	}): Promise<{ id: string } | null>;
	create(args: {
		data: {
			id: string;
			clientId: string;
			boosterId: string | null;
			couponId: string | null;
			status: string;
			serviceType: ServiceType;
			currentLeague: string;
			currentDivision: string;
			currentLp: number;
			desiredLeague: string;
			desiredDivision: string;
			server: string;
			desiredQueue: string;
			lpGain: number;
			deadline: Date;
			subtotal: number;
			totalAmount: number;
			discountAmount: number;
		};
		include: { credentials: true };
	}): Promise<OrderRecord>;
};

type CouponDelegate = {
	findUnique(args: { where: { id: string } }): Promise<CouponRecord | null>;
};

type OrdersTransactionClient = {
	$queryRaw<T>(query: Prisma.Sql): Promise<T>;
	orderQuote: OrderQuoteDelegate;
	order: OrderDelegate;
	coupon: CouponDelegate;
};

@Injectable()
export class PrismaOrderCheckoutRepository implements OrderCheckoutPort {
	constructor(private readonly prisma: PrismaService) {}

	async createDraftOrderFromOwnedQuote(input: {
		orderId: string;
		clientId: string;
		boosterId?: string;
		quoteId: string;
		now: Date;
	}): Promise<Order> {
		return await this.prisma.$transaction(async (tx) => {
			const client = tx as unknown as OrdersTransactionClient;
			const quote = await client.orderQuote.findFirst({
				where: {
					id: input.quoteId,
					clientId: input.clientId,
				},
			});
			if (!quote) throw new OrderQuoteNotFoundError();
			if (quote.consumedAt) throw new OrderQuoteAlreadyUsedError();
			if (quote.expiresAt <= input.now) throw new OrderQuoteExpiredError();
			await this.validateCouponForCheckout(client, {
				clientId: input.clientId,
				couponId: quote.couponId,
			});

			const order = await client.order.create({
				data: {
					id: input.orderId,
					clientId: input.clientId,
					boosterId: input.boosterId ?? null,
					couponId: quote.couponId,
					status: OrderStatus.AWAITING_PAYMENT,
					serviceType: this.mapServiceTypeToPersistence(quote.serviceType),
					currentLeague: quote.currentLeague,
					currentDivision: quote.currentDivision,
					currentLp: quote.currentLp,
					desiredLeague: quote.desiredLeague,
					desiredDivision: quote.desiredDivision,
					server: quote.server,
					desiredQueue: quote.desiredQueue,
					lpGain: quote.lpGain,
					deadline: quote.deadline,
					subtotal: quote.subtotal,
					totalAmount: quote.totalAmount,
					discountAmount: quote.discountAmount,
				},
				include: { credentials: true },
			});

			const consumeResult = await client.orderQuote.updateMany({
				where: {
					id: input.quoteId,
					clientId: input.clientId,
					consumedAt: null,
					expiresAt: {
						gt: input.now,
					},
				},
				data: {
					consumedAt: input.now,
					orderId: order.id,
				},
			});
			if (consumeResult.count === 0) throw new OrderQuoteAlreadyUsedError();

			return this.mapOrderFromRecord(order);
		});
	}

	private async validateCouponForCheckout(
		client: OrdersTransactionClient,
		input: {
			clientId: string;
			couponId: string | null;
		},
	): Promise<void> {
		if (!input.couponId) return;

		const coupon = await client.coupon.findUnique({
			where: { id: input.couponId },
		});
		if (!coupon) throw new OrderCouponInvalidError();
		if (!coupon.isActive) throw new OrderCouponInvalidError();
		if (!Number.isFinite(coupon.discount) || coupon.discount < 0)
			throw new OrderCouponInvalidError();
		if (coupon.discountType !== CouponDiscountType.PERCENTAGE) {
			if (coupon.discountType !== CouponDiscountType.FIXED)
				throw new OrderCouponInvalidError();
		}
		if (!coupon.firstOrderOnly) return;

		await client.$queryRaw<{ id: string }[]>(
			Prisma.sql`SELECT id FROM "users" WHERE id = ${input.clientId} FOR UPDATE`,
		);

		const existingOrder = await client.order.findFirst({
			where: { clientId: input.clientId },
			select: { id: true },
		});
		if (existingOrder) throw new OrderCouponInvalidError();
	}

	private mapOrderFromRecord(record: OrderRecord): Order {
		return Order.rehydrate({
			id: record.id,
			clientId: record.clientId,
			boosterId: record.boosterId,
			couponId: record.couponId,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
			requestDetails: {
				serviceType: this.mapServiceTypeFromPersistence(record.serviceType),
				currentLeague: record.currentLeague ?? '',
				currentDivision: record.currentDivision ?? '',
				currentLp: record.currentLp ?? 0,
				desiredLeague: record.desiredLeague ?? '',
				desiredDivision: record.desiredDivision ?? '',
				server: record.server ?? '',
				desiredQueue: record.desiredQueue ?? '',
				lpGain: record.lpGain ?? 0,
				deadline: record.deadline ?? new Date(0),
			},
			subtotal: record.subtotal,
			totalAmount: record.totalAmount,
			discountAmount: record.discountAmount,
		});
	}

	private mapServiceTypeFromPersistence(
		serviceType: string | null,
	): OrderServiceType {
		switch (serviceType) {
			case ServiceType.ELO_BOOST:
				return 'elo_boost';
			case ServiceType.DUO_BOOST:
				return 'duo_boost';
			case ServiceType.MD5:
				return 'md5';
			case ServiceType.COACHING:
				return 'coaching';
			default:
				throw new Error(`Invalid order service type persisted: ${serviceType}`);
		}
	}

	private mapServiceTypeToPersistence(serviceType: string): ServiceType {
		switch (serviceType) {
			case 'elo_boost':
			case ServiceType.ELO_BOOST:
				return ServiceType.ELO_BOOST;
			case 'duo_boost':
			case ServiceType.DUO_BOOST:
				return ServiceType.DUO_BOOST;
			case 'md5':
			case ServiceType.MD5:
				return ServiceType.MD5;
			case 'coaching':
			case ServiceType.COACHING:
				return ServiceType.COACHING;
			default:
				throw new Error(`Invalid order service type persisted: ${serviceType}`);
		}
	}
}
